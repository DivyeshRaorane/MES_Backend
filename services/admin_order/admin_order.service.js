import pool from "../../db/postgres.js";

/**
 * Admin Order service layer.
 *
 * Backed by four PostgreSQL tables that all relate via the natural key `order_no`:
 *   - order_hdr  (header, order_no is PK)
 *   - order_comp (components)
 *   - order_opr  (operations)
 *   - order_conf (confirmations) -> READ ONLY, populated later by SAP.
 *
 * Nullable numeric fields must stay NULL when not provided (never coerced to 0),
 * so we use `?? null` for numerics instead of `|| null`.
 */

// Coerce undefined/empty-string to null while preserving 0 for numeric fields.
const numOrNull = (v) => (v === undefined || v === null || v === "" ? null : v);
// Coerce undefined to null for text fields.
const textOrNull = (v) => (v === undefined || v === null ? null : v);

// Allowed order type values. Nullable: null/empty stays null. Any other value is rejected.
const ALLOWED_ORDER_TYPES = ["DRAW", "PT", "REW", "COLOR"];
const orderTypeOrNull = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const normalized = String(v).trim().toUpperCase();
    if (!ALLOWED_ORDER_TYPES.includes(normalized)) {
        const err = new Error(
            `Invalid type. Allowed values: ${ALLOWED_ORDER_TYPES.join(", ")}`
        );
        err.code = "INVALID_ORDER_TYPE";
        throw err;
    }
    return normalized;
};

// ─── LIST: one row per header + component/operation counts ───
export const getAllOrdersS = async () => {
    const query = `
        SELECT
            h.order_no,
            h.material_code,
            h.order_qty,
            h.uom,
            h.gr_qty,
            h."type",
            h.order_status,
            h.order_creation_date,
            h.updated_at,
            COALESCE(c.total_components, 0) AS total_components,
            COALESCE(o.total_operations, 0) AS total_operations
        FROM order_hdr h
        LEFT JOIN (
            SELECT order_no, COUNT(*)::int AS total_components
            FROM order_comp GROUP BY order_no
        ) c ON c.order_no = h.order_no
        LEFT JOIN (
            SELECT order_no, COUNT(*)::int AS total_operations
            FROM order_opr GROUP BY order_no
        ) o ON o.order_no = h.order_no
        WHERE COALESCE(h.is_active, true) = true
        ORDER BY h.order_creation_date DESC NULLS LAST, h.updated_at DESC NULLS LAST;
    `;

    const result = await pool.query(query);
    return result.rows;
};

// ─── DETAIL: header + components + operations + confirmations ───
export const getOrderByNoS = async (orderNo) => {
    const headerResult = await pool.query(
        `SELECT order_no, material_code, order_qty, uom, gr_qty, storage_location,
                "type", order_status, order_creation_date, updated_at
         FROM order_hdr WHERE order_no = $1`,
        [orderNo]
    );

    if (headerResult.rowCount === 0) {
        return null; // controller turns this into a 404
    }

    const [components, operations, confirmations] = await Promise.all([
        pool.query(
            `SELECT order_comp_id, order_no, material_code, mat_desc, qty, uom, movement_type,storage_location
             FROM order_comp WHERE order_no = $1 ORDER BY order_comp_id ASC`,
            [orderNo]
        ),
        pool.query(
            `SELECT order_opr_id, order_no, operation_no, workcenter, operation_qty,
                    activity_1, activity_2, activity_3, activity_4, activity_5, activity_6
             FROM order_opr WHERE order_no = $1 ORDER BY operation_no ASC, order_opr_id ASC`,
            [orderNo]
        ),
        pool.query(
            `SELECT order_conf_id, order_no, confrmation_no, confirmation_counter,
                    cancelling_flag, operation_no, confirmed_qty, gr_document, inspection_lot
             FROM order_conf WHERE order_no = $1 ORDER BY confrmation_no ASC, confirmation_counter ASC`,
            [orderNo]
        ),
    ]);

    return {
        header: headerResult.rows[0],
        components: components.rows,
        operations: operations.rows,
        confirmations: confirmations.rows,
    };
};

// ─── Helpers to insert child rows using a transaction client ───
const insertComponents = async (client, orderNo, components = []) => {
    for (const c of components) {
        await client.query(
            `INSERT INTO order_comp (order_no, material_code, mat_desc, qty, uom, movement_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                orderNo,
                textOrNull(c.material_code),
                textOrNull(c.mat_desc),
                numOrNull(c.qty),
                textOrNull(c.uom),
                numOrNull(c.movement_type),
            ]
        );
    }
};

const insertOperations = async (client, orderNo, operations = []) => {
    for (const o of operations) {
        await client.query(
            `INSERT INTO order_opr (
                order_no, operation_no, workcenter, operation_qty,
                activity_1, activity_2, activity_3, activity_4, activity_5, activity_6
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                orderNo,
                numOrNull(o.operation_no),
                textOrNull(o.workcenter),
                numOrNull(o.operation_qty),
                numOrNull(o.activity_1),
                numOrNull(o.activity_2),
                numOrNull(o.activity_3),
                numOrNull(o.activity_4),
                numOrNull(o.activity_5),
                numOrNull(o.activity_6),
            ]
        );
    }
};

// ─── CREATE: header + components + operations in a single transaction ───
export const createOrderS = async (payload) => {
    const { header = {}, components = [], operations = [] } = payload || {};
    const orderNo = header.order_no;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Reject duplicate order_no.
        const dup = await client.query(
            `SELECT order_no FROM order_hdr WHERE order_no = $1`,
            [orderNo]
        );
        if (dup.rowCount > 0) {
            const err = new Error("Order already exists");
            err.code = "ORDER_EXISTS";
            throw err;
        }

        await client.query(
            `INSERT INTO order_hdr (
                order_no, material_code, order_qty, uom, gr_qty,
                "type", order_status, order_creation_date, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
            [
                orderNo,
                textOrNull(header.material_code),
                numOrNull(header.order_qty),
                textOrNull(header.uom),
                numOrNull(header.gr_qty),
                orderTypeOrNull(header.type),
                textOrNull(header.order_status),
                textOrNull(header.order_creation_date),
            ]
        );

        await insertComponents(client, orderNo, components);
        await insertOperations(client, orderNo, operations);

        await client.query("COMMIT");

        // Confirmations in the body (if any) are intentionally ignored.
        return await getOrderByNoS(orderNo);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// ─── UPDATE: update header, full-replace components + operations. Never touch order_conf ───
export const updateOrderS = async (orderNo, payload) => {
    const { header = {}, components = [], operations = [] } = payload || {};

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const updateResult = await client.query(
            `UPDATE order_hdr SET
                material_code = $1,
                order_qty = $2,
                uom = $3,
                gr_qty = $4,
                "type" = $5,
                order_status = $6,
                order_creation_date = $7,
                updated_at = now()
             WHERE order_no = $8`,
            [
                textOrNull(header.material_code),
                numOrNull(header.order_qty),
                textOrNull(header.uom),
                numOrNull(header.gr_qty),
                orderTypeOrNull(header.type),
                textOrNull(header.order_status),
                textOrNull(header.order_creation_date),
                orderNo,
            ]
        );

        if (updateResult.rowCount === 0) {
            const err = new Error("Order not found");
            err.code = "ORDER_NOT_FOUND";
            throw err;
        }

        // Full replace of children (order_conf is deliberately untouched).
        await client.query(`DELETE FROM order_comp WHERE order_no = $1`, [orderNo]);
        await client.query(`DELETE FROM order_opr WHERE order_no = $1`, [orderNo]);

        await insertComponents(client, orderNo, components);
        await insertOperations(client, orderNo, operations);

        await client.query("COMMIT");

        return await getOrderByNoS(orderNo);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// ─── SOFT DELETE / RESTORE: flip is_active. Never removes rows. ───
// Disabled orders (is_active = false) are hidden from the list and are skipped
// by the SAP re-sync (they are not overwritten or resurrected).
export const setOrderActiveS = async (orderNo, isActive) => {
    const result = await pool.query(
        `UPDATE order_hdr
            SET is_active = $1,
                updated_at = now()
          WHERE order_no = $2
        RETURNING order_no, is_active`,
        [isActive, orderNo]
    );

    if (result.rowCount === 0) {
        const err = new Error("Order not found");
        err.code = "ORDER_NOT_FOUND";
        throw err;
    }

    return result.rows[0];
};
