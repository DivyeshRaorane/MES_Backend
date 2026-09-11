import pool from "../../../db/postgres.js";

/**
 * SAP Transaction Insert Service
 *
 * Inserts rows into the `sap_transaction` table for two situations:
 *
 *  1. fg = "good"  -> type = "FG"
 *     - Looks up prod_order from `order_hdr` using fg_material_code where
 *       order_status = 'REL'.
 *     - Inserts the FG row (conf_qty, fg_batch, fg_material_code ...).
 *     - Component fields (comp_material_code, plant, s_location, comp_batch,
 *       comp_quantity) are only inserted when they are actually provided.
 *
 *  2. fg = "scrap" -> type = "SCRAP"
 *     - Skips the process-order lookup (prod_order stays blank/null).
 *     - Inserts whatever data was given as-is.
 *
 * This service manages its own transaction (BEGIN / COMMIT / ROLLBACK).
 */

/* ── small value helpers: keep 0, turn "" / undefined into null ── */
const numOrNull = (v) => (v === undefined || v === null || v === "" ? null : v);
const textOrNull = (v) => (v === undefined || v === null || v === "" ? null : v);

/**
 * Look up the released process order number for a finished-goods material.
 *
 * @param {string} fgMaterialCode
 * @param {object} client - pg client inside an open transaction
 * @returns {{order_no: string, order_qty: number|null, gr_qty: number|null}|null}
 *          the released order row, or null when none is REL
 */
const findReleasedProdOrder = async (fgMaterialCode, client, orderType = null) => {
    // Base params: material_code is always $1.
    const params = [fgMaterialCode];
    let typeFilter = "";

    // Optional filter on order_hdr.type (DRAW/PT/REW/COLOR). "type" is quoted
    // because it is a reserved-ish word in Postgres. When orderType is null the
    // query behaves exactly as before (no type filter).
    if (orderType !== null && orderType !== undefined && orderType !== "") {
        params.push(orderType);
        typeFilter = `AND "type" = $${params.length}`;
    }

    const result = await client.query(
        `SELECT order_no, order_qty, gr_qty
           FROM order_hdr
          WHERE material_code = $1
            AND order_status IN ('REL', 'PCNF')
            ${typeFilter}
          ORDER BY order_creation_date DESC NULLS LAST
          LIMIT 1`,
        params
    );

    return result.rows.length ? result.rows[0] : null;
};

/**
 * Resolve the component material code from a component batch.
 *
 * Looks up `preform_data` where preform_id = comp_batch and returns its
 * material_code. Returns null when no matching preform row is found.
 *
 * @param {string} compBatch
 * @param {object} client - pg client inside an open transaction
 * @returns {string|null}
 */
const findCompMaterialCodeFromBatch = async (compBatch, client) => {
    const result = await client.query(
        `SELECT material_code
           FROM preform_data
          WHERE preform_id = $1
          LIMIT 1`,
        [compBatch]
    );

    return result.rows.length ? result.rows[0].material_code : null;
};

/**
 * Insert a single row into sap_transaction.
 *
 * @param {object} client - pg client
 * @param {object} row
 * @returns {object} the inserted row
 */
const insertTransactionRow = async (client, row) => {
    const {
        prod_order,
        operation,
        conf_qty,
        fg_batch,
        fg_material_code,
        comp_material_code,
        plant,
        s_location,
        comp_batch,
        comp_quantity,
        type,
        ud_required,
    } = row;

    const result = await client.query(
        `INSERT INTO transactions (
            prod_order, operation, conf_qty, fg_batch, fg_material_code,
            comp_material_code, plant, s_location, comp_batch, comp_quantity,
            type, ud_required, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, current_timestamp)
        RETURNING *`,
        [
            textOrNull(prod_order),
            numOrNull(operation),
            numOrNull(conf_qty),
            textOrNull(fg_batch),
            textOrNull(fg_material_code),
            textOrNull(comp_material_code),
            numOrNull(plant),
            numOrNull(s_location),
            textOrNull(comp_batch),
            numOrNull(comp_quantity),
            textOrNull(type),
            ud_required === undefined ? false : Boolean(ud_required),
        ]
    );

    return result.rows[0];
};

/**
 * Main entry point.
 *
 * Expected `data` fields:
 *   fg                 - "good" | "scrap"   (case-insensitive)
 *   fg_material_code   - required for the FG lookup
 *   order_type         - (optional) filter the released order lookup on
 *                        order_hdr.type (DRAW/PT/REW/COLOR). Omit for no filter.
 *   conf_qty           - confirmed quantity
 *   fg_batch           - finished-goods batch
 *   operation          - (optional) operation number
 *   comp_material_code - (optional) component material code
 *   plant              - (optional)
 *   s_location         - (optional)
 *   comp_batch         - (optional)
 *   comp_quantity      - (optional)
 *
 * @param {object} data
 * @param {object} [externalClient] - reuse an existing txn client if provided;
 *                                    when omitted the service opens its own txn.
 * @returns {object} { type, prod_order, inserted } where inserted is the row list
 */
export const insertSapTransaction = async (data, externalClient = null) => {
    if (!data || typeof data !== "object") {
        throw new Error("insertSapTransaction: data payload is required");
    }

    const fg = String(data.fg || "").trim().toLowerCase();
    if (fg !== "good" && fg !== "scrap") {
        throw new Error(`insertSapTransaction: fg must be "good" or "scrap" (got "${data.fg}")`);
    }

    const isScrap = fg === "scrap";
    const type = isScrap ? "SCRAP" : "FG";

    // Use the caller's transaction if supplied; otherwise manage our own.
    const client = externalClient || (await pool.connect());
    const ownTransaction = !externalClient;

    try {
        if (ownTransaction) await client.query("BEGIN");

        let prodOrder = null;

        // ── Situation 1: fg = good -> find the released process order ──
        if (!isScrap) {
            if (!textOrNull(data.fg_material_code)) {
                throw new Error("insertSapTransaction: fg_material_code is required when fg = good");
            }

            const order = await findReleasedProdOrder(data.fg_material_code, client, data.order_type);
            if (!order) {
                throw new Error(
                    `No released (REL) process order found in order_hdr for fg_material_code "${data.fg_material_code}"`
                );
            }

            prodOrder = order.order_no;

            // ── Over-confirmation guard ──
            // Block (and roll back) when the order quantity cannot absorb the
            // already-confirmed quantity (gr_qty) plus this incoming conf_qty.
            //   order_qty < gr_qty + conf_qty  ->  error
            const orderQty = Number(order.order_qty);
            const grQty = Number(order.gr_qty) || 0;
            const confQty = Number(data.conf_qty) || 0;

            if (Number.isFinite(orderQty) && orderQty < grQty + confQty) {
                throw new Error(
                    `Confirmation exceeds process order quantity for order "${prodOrder}": ` +
                    `order_qty (${orderQty}) < gr_qty (${grQty}) + conf_qty (${confQty}) ` +
                    `= ${grQty + confQty}`
                );
            }
        }
        // ── Situation 2: fg = scrap -> skip lookup, prod_order stays null ──

        // Resolve comp_material_code from comp_batch (preform_data lookup)
        // when a batch is given but no explicit component material code was.
        let compMaterialCode = textOrNull(data.comp_material_code);
        if (compMaterialCode === null && textOrNull(data.comp_batch) !== null) {
            compMaterialCode = await findCompMaterialCodeFromBatch(data.comp_batch, client);
        }

        const inserted = [];

        // Single row carrying both FG fields and component fields.
        const row = await insertTransactionRow(client, {
            prod_order: prodOrder,
            operation: data.operation,
            conf_qty: data.conf_qty,
            fg_batch: data.fg_batch,
            fg_material_code: data.fg_material_code,
            comp_material_code: compMaterialCode,
            plant: data.plant,
            s_location: data.s_location,
            comp_batch: data.comp_batch,
            comp_quantity: data.comp_quantity,
            type,
            ud_required: data.ud_required,
        });
        inserted.push(row);

        if (ownTransaction) await client.query("COMMIT");

        return {
            type,
            prod_order: prodOrder,
            rows_inserted: inserted.length,
            inserted,
        };
    } catch (error) {
        if (ownTransaction) {
            try {
                await client.query("ROLLBACK");
            } catch (_) {
                /* ignore rollback error */
            }
        }
        throw error;
    } finally {
        if (ownTransaction) client.release();
    }
};

export default insertSapTransaction;
