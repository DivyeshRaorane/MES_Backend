import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Process Order sync.
 *
 * Calls the SAP process-order endpoint. When a creation date is supplied the
 * results are filtered by that date; when no date is supplied ALL orders are
 * fetched. For each order returned:
 *   - checks whether order_no already exists in order_hdr,
 *   - if it exists -> UPDATE the header and re-sync its components/operations,
 *   - if not -> insert header + components + operations across
 *     order_hdr / order_comp / order_opr in a single transaction.
 *
 * On re-sync of an existing order the header is updated in place (including
 * gr_qty and the order type from SAP's ManufacturingOrderType, e.g. "ZSFG")
 * and its order_comp / order_opr rows are replaced (delete + re-insert) so the
 * DB mirrors the latest SAP payload.
 *
 * order_conf is never written or touched here (SAP populates it separately
 * later, keyed independently by confirmation).
 *
 * NOTE: The exact SAP field names for /getorder are not yet confirmed. The
 * pick() helpers below read several likely name variants so the mapping keeps
 * working; adjust the candidate lists once the real payload is known. The raw
 * response is logged to help with that.
 */

// Build the full endpoint from the SAP base URL (handles trailing slash safely).
const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${endpoint}`;
};

const SAP_URL = buildSapUrl(process.env.SAP_PROCESS_ORDER_ENDPOINT || "prodordergetdetails");

// ─── Value helpers (preserve 0 for numerics, only null when truly missing) ───
const numOrNull = (v) => (v === undefined || v === null || v === "" ? null : v);
const textOrNull = (v) => (v === undefined || v === null || v === "" ? null : v);

/**
 * Read the first present value from a list of candidate keys on an object.
 * Case-insensitive-ish: tries the exact keys given.
 */
const pick = (obj, keys) => {
    if (!obj) return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return undefined;
};

// Return an array from a possibly-single value / nested list.
const asArray = (v) => {
    if (v === undefined || v === null) return [];
    return Array.isArray(v) ? v : [v];
};

/**
 * SAP OData dates arrive as "/Date(1787961600000)/". Convert to "YYYY-MM-DD".
 * Returns null when the value is missing or unparseable.
 */
const parseSapDate = (v) => {
    if (!v) return null;
    const m = /\/Date\((\d+)\)\//.exec(String(v));
    if (m) {
        const d = new Date(Number(m[1]));
        if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    // Already a plain date string
    const str = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    return null;
};

/** Parse a numeric-ish value to an integer, or null. */
const intOrNull = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(String(v), 10);
    return Number.isNaN(n) ? null : n;
};

/**
 * Derive a short order status from SAP's boolean-ish flag fields
 * ("X" = true). Priority: technically completed > confirmed > released > created.
 */
const deriveOrderStatus = (raw) => {
    const isSet = (k) => String(raw?.[k] || "").toUpperCase() === "X";
    if (isSet("OrderIsTechnicallyCompleted")) return "TECO";
    if (isSet("OrderIsClosed")) return "CLSD";
    if (isSet("OrderIsConfirmed")) return "CNF";
    if (isSet("OrderIsPartiallyConfirmed")) return "PCNF";
    if (isSet("OrderIsReleased")) return "REL";
    if (isSet("OrderIsCreated")) return "CRTD";
    return null;
};

/** Today's date as YYYY-MM-DD (local). */
const todayDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

/**
 * Normalize an incoming date into "YYYY-MM-DD".
 * Accepts:
 *   - "DD-MM-YYYY"  e.g. "29-08-2026"
 *   - "YYYY-MM-DD"  e.g. "2026-08-29"
 *   - a value that already has a "T" time part (returned as-is)
 */
const normalizeToYmd = (dateStr) => {
    if (!dateStr) return todayDate();

    const str = String(dateStr).trim();

    // Already a full timestamp -> leave untouched
    if (str.includes("T")) return str;

    // DD-MM-YYYY -> YYYY-MM-DD
    const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(str);
    if (dmy) {
        const [, dd, mm, yyyy] = dmy;
        return `${yyyy}-${mm}-${dd}`;
    }

    // Assume it is already YYYY-MM-DD (or something SAP accepts as-is)
    return str;
};

/**
 * Format a date into the SAP timestamp shape "YYYY-MM-DDT00:00:00".
 * Accepts DD-MM-YYYY, YYYY-MM-DD, or an already-formatted timestamp.
 */
const toSapDateTime = (dateStr) => {
    const date = normalizeToYmd(dateStr);
    return date.includes("T") ? date : `${date}T00:00:00`;
};

/**
 * Call SAP /getorder (POST) with the given date (defaults to today) and return
 * the flat array of order objects from the response.
 */
const fetchProcessOrdersFromSAP = async (dateStr) => {
    // When a date is provided, filter SAP by that creation date.
    // When it is empty/missing, omit MfgOrderCreationDate so SAP returns ALL orders.
    const hasDate = dateStr !== undefined && dateStr !== null && String(dateStr).trim() !== "";

    const payload = {
        ProductionPlant: process.env.SAP_PROCESS_ORDER_PLANT || "1200",
        ...(hasDate ? { MfgOrderCreationDate: toSapDateTime(dateStr) } : {}),
    };

    console.log("[Process Order Sync] POST URL:", SAP_URL);
    console.log("[Process Order Sync] Request payload:", payload);

    const endpoint = process.env.SAP_PROCESS_ORDER_ENDPOINT || "prodordergetdetails";
    const startedAt = Date.now();
    let body;
    try {
        body = await postWithAuth(SAP_URL, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "GET_ORDER",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: SAP_URL,
            http_status_code: httpError.response?.status,
            message: httpError.message,
            reference_type: "MFG_ORDER_CREATION_DATE",
            reference_id: payload.MfgOrderCreationDate || "ALL",
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        throw httpError;
    }
    console.log("[Process Order Sync] RESPONSE:", JSON.stringify(body, null, 2));

    // SAP responses in this project wrap rows under "Data"; fall back to the
    // body itself if it is already an array.
    const rows = Array.isArray(body.Data)
        ? body.Data
        : Array.isArray(body)
        ? body
        : [];

    await logSapCall({
        operation: "GET_ORDER",
        status: "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: SAP_URL,
        http_status_code: Number(body?.StatusCode) || null,
        message: body?.Message ?? `fetched ${rows.length} order(s)`,
        reference_type: "MFG_ORDER_CREATION_DATE",
        reference_id: payload.MfgOrderCreationDate || "ALL",
        request_payload: payload,
        response_payload: body,
        duration_ms: Date.now() - startedAt,
    });

    return rows;
};

/**
 * POST to a SAP endpoint with a bearer token. If the token is rejected
 * (401), log in again once and retry.
 */
const postWithAuth = async (url, payload) => {
    console.log("Payoad", payload)
    try {
        const response = await axios({
            method: "POST",
            url,
            data: payload,
            headers: {
                "Content-Type": "application/json",
                ...(await sapAuthHeader()),
            },
        });
        
        return response.data || {};
        
    } catch (error) {
        if (error.response?.status === 401) {
            // Token likely expired/invalid -> force a fresh login and retry once.
            clearSapToken();
            const response = await axios({
                method: "POST",
                url,
                data: payload,
                headers: {
                    "Content-Type": "application/json",
                    ...(await sapAuthHeader(true)),
                },
            });
            return response.data || {};
        }
        throw error;
    }
};

/**
 * Given a list of order numbers, return a Map of order_no -> is_active for the
 * ones already present in order_hdr. Orders not in the map are new.
 * is_active defaults to true when the column is null.
 */
const getExistingOrders = async (orderNos) => {
    const map = new Map();
    if (orderNos.length === 0) return map;

    const result = await pool.query(
        `SELECT order_no, COALESCE(is_active, true) AS is_active
           FROM order_hdr
          WHERE order_no = ANY($1::text[])`,
        [orderNos]
    );
    for (const row of result.rows) map.set(String(row.order_no), row.is_active === true);
    return map;
};

/**
 * Pull the "results" array out of a SAP OData navigation property, which may
 * be either { results: [...] } or a plain array / single object.
 */
const odataResults = (nav) => {
    if (!nav) return [];
    if (Array.isArray(nav)) return nav;
    if (Array.isArray(nav.results)) return nav.results;
    return asArray(nav);
};

// ─── Normalize a raw SAP order into { header, components, operations } ───
// Field names match SAP OData API_PRODUCTION_ORDER_2_SRV, with fallbacks to
// simpler names in case the SAP wrapper flattens them.
const normalizeOrder = (raw) => {
    const orderNo = pick(raw, ["ManufacturingOrder", "order_no", "OrderNo", "Order", "ProcessOrder"]);

    const header = {
        order_no: orderNo,
        material_code: pick(raw, ["Material", "material_code", "MaterialCode"]),
        order_qty: pick(raw, ["TotalQuantity", "order_qty", "OrderQty"]),
        uom: pick(raw, ["ProductionUnit", "uom", "Uom", "BaseUnit"]),
        gr_qty: pick(raw, ["MfgOrderConfirmedYieldQty", "gr_qty", "GrQty", "GoodsReceiptQty"]),
        order_status: deriveOrderStatus(raw) || pick(raw, ["order_status", "OrderStatus", "Status"]) || null,
        order_creation_date: parseSapDate(
            pick(raw, ["MfgOrderCreationDate", "order_creation_date", "OrderCreationDate", "CreationDate"])
        ),
        storage_location: pick(raw, ["StorageLocation", "storage_location", "StorageLoc"]),
        type: pick(raw, ["ManufacturingOrderType", "type", "OrderType", "ProcessOrderType"]),
    };

    const rawComponents = odataResults(
        pick(raw, ["to_ProductionOrderComponent", "components", "Components", "order_comp"])
    );
    const components = rawComponents.map((c) => ({
        material_code: pick(c, ["Material", "material_code", "MaterialCode"]),
        mat_desc: pick(c, ["BOMItemDescription", "mat_desc", "MaterialDescription", "Description"]),
        qty: pick(c, ["RequiredQuantity", "qty", "Qty", "Quantity"]),
        uom: pick(c, ["BaseUnit", "uom", "Uom"]),
        movement_type: pick(c, ["GoodsMovementType", "movement_type", "MovementType"]),
        storage_location: pick(c, ["StorageLocation", "storage_location", "StorageLoc"]),
    }));

    const rawOperations = odataResults(
        pick(raw, ["to_ProductionOrderOperation", "operations", "Operations", "order_opr"])
    );
    const operations = rawOperations.map((o) => ({
        operation_no: pick(o, ["ManufacturingOrderOperation", "operation_no", "OperationNo", "Operation"]),
        workcenter: pick(o, ["WorkCenter", "workcenter", "Workcenter"]),
        operation_qty: pick(o, ["OpPlannedTotalQuantity", "operation_qty", "OperationQty"]),
        activity_1: pick(o, ["activity_1", "Activity1", "VGW01"]),
        activity_2: pick(o, ["activity_2", "Activity2", "VGW02"]),
        activity_3: pick(o, ["activity_3", "Activity3", "VGW03"]),
        activity_4: pick(o, ["activity_4", "Activity4", "VGW04"]),
        activity_5: pick(o, ["activity_5", "Activity5", "VGW05"]),
        activity_6: pick(o, ["activity_6", "Activity6", "VGW06"]),
    }));

    return { header, components, operations };
};

// ─── Insert the child rows (components + operations) for an order ───
const insertOrderChildren = async (client, orderNo, components, operations) => {
    for (const c of components) {
        await client.query(
            `INSERT INTO order_comp (order_no, material_code, mat_desc, qty, uom, movement_type, storage_location)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                orderNo,
                textOrNull(c.material_code),
                textOrNull(c.mat_desc),
                numOrNull(c.qty),
                textOrNull(c.uom),
                intOrNull(c.movement_type),
                textOrNull(c.storage_location),
            ]
        );
    }

    for (const o of operations) {
        await client.query(
            `INSERT INTO order_opr (
                order_no, operation_no, workcenter, operation_qty,
                activity_1, activity_2, activity_3, activity_4, activity_5, activity_6
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                orderNo,
                intOrNull(o.operation_no),
                textOrNull(o.workcenter),
                numOrNull(o.operation_qty),
                intOrNull(o.activity_1),
                intOrNull(o.activity_2),
                intOrNull(o.activity_3),
                intOrNull(o.activity_4),
                intOrNull(o.activity_5),
                intOrNull(o.activity_6),
            ]
        );
    }
};

// ─── Insert a brand-new order (header + children) using a txn client ───
const insertOrder = async (client, order) => {
    const { header, components, operations } = order;
    const orderNo = header.order_no;

    await client.query(
        `INSERT INTO order_hdr (
            order_no, material_code, order_qty, uom, gr_qty,
            order_status, order_creation_date, storage_location, type, is_active, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, now())`,
        [
            orderNo,
            textOrNull(header.material_code),
            numOrNull(header.order_qty),
            textOrNull(header.uom),
            numOrNull(header.gr_qty),
            textOrNull(header.order_status),
            textOrNull(header.order_creation_date),
            textOrNull(header.storage_location),
            textOrNull(header.type),
        ]
    );

    await insertOrderChildren(client, orderNo, components, operations);
};

// ─── Update an existing order (header in place + replace children) ───
// The header is refreshed from SAP, including gr_qty and the order type
// (ManufacturingOrderType, e.g. "ZSFG"). Children (order_comp / order_opr) are
// replaced wholesale so removed/added lines in SAP are mirrored. order_conf is
// never touched.
const updateOrder = async (client, order) => {
    const { header, components, operations } = order;
    const orderNo = header.order_no;

    await client.query(
        `UPDATE order_hdr SET
            material_code       = $2,
            order_qty           = $3,
            uom                 = $4,
            gr_qty              = $5,
            order_status        = $6,
            order_creation_date = $7,
            storage_location    = $8,
            type                = $9,
            updated_at          = now()
         WHERE order_no = $1`,
        [
            orderNo,
            textOrNull(header.material_code),
            numOrNull(header.order_qty),
            textOrNull(header.uom),
            numOrNull(header.gr_qty),
            textOrNull(header.order_status),
            textOrNull(header.order_creation_date),
            textOrNull(header.storage_location),
            textOrNull(header.type),
        ]
    );

    // Replace child rows so the DB mirrors the latest SAP payload.
    await client.query(`DELETE FROM order_comp WHERE order_no = $1`, [orderNo]);
    await client.query(`DELETE FROM order_opr WHERE order_no = $1`, [orderNo]);

    await insertOrderChildren(client, orderNo, components, operations);
};

/**
 * Core sync:
 *  1. Fetch today's (or a given date's) process orders from SAP.
 *  2. For each order already present in order_hdr -> UPDATE it (header in
 *     place, components/operations replaced). gr_qty is preserved.
 *  3. Insert each new order (header + components + operations).
 *  One transaction PER order so a bad order doesn't roll back good ones.
 *
 * @param {string} [dateStr] optional YYYY-MM-DD. When provided, SAP is filtered
 *   by that creation date. When empty/omitted, ALL orders are fetched (no date
 *   filter is sent to SAP).
 * @returns {object} summary
 */
export const syncProcessOrders = async (dateStr) => {
    const rawOrders = await fetchProcessOrdersFromSAP(dateStr);
    console.log("[Process Order Sync] Raw SAP response rows:", JSON.stringify(rawOrders, null, 2));

    const hasDate = dateStr !== undefined && dateStr !== null && String(dateStr).trim() !== "";

    const summary = {
        date: hasDate ? normalizeToYmd(dateStr) : "ALL",
        fetched: rawOrders.length,
        inserted: 0,
        updated: 0,
        skipped_disabled: 0,
        skipped_no_order_no: 0,
        skipped_duplicate_in_batch: 0,
        failed: 0,
        inserted_order_nos: [],
        updated_order_nos: [],
        skipped_disabled_order_nos: [],
        failed_order_nos: [],
        // Per-order breakdown for the frontend. Each entry:
        //   { order_no, status: "inserted" | "updated" | "skipped" | "failed", reason, message }
        details: [],
    };

    if (rawOrders.length === 0) return summary;

    const normalized = rawOrders.map(normalizeOrder);

    // Order numbers present in this response (used to pre-check existence).
    const orderNosInResponse = [
        ...new Set(
            normalized
                .map((o) => (o.header.order_no ? String(o.header.order_no) : null))
                .filter(Boolean)
        ),
    ];

    // Map of order_no -> is_active for orders already in the DB.
    const existing = await getExistingOrders(orderNosInResponse);
    const seenInThisRun = new Set();

    for (const order of normalized) {
        const orderNo = order.header.order_no ? String(order.header.order_no) : null;

        if (!orderNo) {
            summary.skipped_no_order_no += 1;
            summary.details.push({
                order_no: null,
                status: "skipped",
                reason: "no_order_no",
                message: "Order has no ManufacturingOrder number",
            });
            continue;
        }

        // Same order returned twice in one response -> process once.
        if (seenInThisRun.has(orderNo)) {
            summary.skipped_duplicate_in_batch += 1;
            summary.details.push({
                order_no: orderNo,
                status: "skipped",
                reason: "duplicate_in_response",
                message: `Order ${orderNo} appeared more than once in this response`,
            });
            continue;
        }

        // Already in DB -> update in place; otherwise insert new.
        const isExisting = existing.has(orderNo);

        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            if (isExisting) {
                await updateOrder(client, order);
            } else {
                await insertOrder(client, order);
            }
            await client.query("COMMIT");

            seenInThisRun.add(orderNo);
            if (isExisting) {
                summary.updated += 1;
                summary.updated_order_nos.push(orderNo);
                summary.details.push({
                    order_no: orderNo,
                    status: "updated",
                    reason: "resynced_existing",
                    message: `Order ${orderNo} updated`,
                });
            } else {
                summary.inserted += 1;
                summary.inserted_order_nos.push(orderNo);
                summary.details.push({
                    order_no: orderNo,
                    status: "inserted",
                    reason: "new_order",
                    message: `Order ${orderNo} inserted`,
                });
            }
        } catch (error) {
            await client.query("ROLLBACK");
            summary.failed += 1;
            summary.failed_order_nos.push(orderNo);
            summary.details.push({
                order_no: orderNo,
                status: "failed",
                reason: isExisting ? "update_error" : "insert_error",
                message: error.message,
            });
            console.error(
                `[Process Order Sync] Failed to ${isExisting ? "update" : "insert"} order ${orderNo}:`,
                error.message
            );
        } finally {
            client.release();
        }
    }

    return summary;
};
