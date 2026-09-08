import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Transaction Posting Service
 *
 * Reads pending rows from `sap_transaction` (status = false) in FIFO order
 * (oldest transaction_id first) and posts them ONE ROW AT A TIME — no grouping.
 * Each pending row results in exactly one SAP API call:
 *
 *   type = 'FG'    -> POST {SAP_BASE_URL}/prdorderconfirmation
 *                     Production order confirmation. The row's own component
 *                     data (if present) rides along as a single `Toitem`.
 *
 *   type = 'SCRAP' -> POST {SAP_BASE_URL}/goods-issue-cost-center
 *                     551/201 goods issue to a cost center. The row becomes one
 *                     `to_MaterialDocumentItem`.
 *
 * On a successful post the row is marked status = true.
 *
 * Exposes:
 *   - postPendingSapTransactions()           post every pending row, FIFO
 *   - postSingleSapTransaction(transactionId) post one row by id
 */

/* ── URL + env helpers ─────────────────────────────────────── */

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const FG_URL = () => buildSapUrl(process.env.SAP_FG_CONFIRMATION_ENDPOINT || "prdorderconfirmation");
const SCRAP_URL = () => buildSapUrl(process.env.SAP_SCRAP_GOODS_ISSUE_ENDPOINT || "goods-issue-cost-center");

const PLANT = () => process.env.SAP_TXN_PLANT || "1200";
const STORAGE_LOCATION = () => process.env.SAP_TXN_STORAGE_LOCATION || "1201";
const SCRAP_MOVEMENT_TYPE = () => process.env.SAP_SCRAP_MOVEMENT_TYPE || "551";
const SCRAP_GOODS_MOVEMENT_CODE = () => process.env.SAP_SCRAP_GOODS_MOVEMENT_CODE || "03";
const SCRAP_ENTRY_UNIT = () => process.env.SAP_SCRAP_ENTRY_UNIT || "KG";
const SCRAP_COST_CENTER = () => process.env.SAP_SCRAP_COST_CENTER || "1200000101";

/* ── value helpers ─────────────────────────────────────────── */

// Convert a numeric-ish DB value to a plain string (SAP payloads use strings).
const str = (v) => (v === undefined || v === null ? null : String(v));

// SAP OData date: /Date(<epoch ms>)/ for a given JS Date (defaults now).
const sapDate = (d = new Date()) => `/Date(${d.getTime()})/`;

// Pad the operation to 4 digits as SAP expects (10 -> "0010").
const padOperation = (op) => {
    if (op === undefined || op === null || op === "") return null;
    return String(op).padStart(4, "0");
};

// Strip SAP zero-padding from an order/number ("001210000168" -> "1210000168").
const unpad = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).replace(/^0+/, "");
    return s === "" ? "0" : s;
};

// Parse an integer out of a possibly zero-padded / noisy string, else null.
const toInt = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
    return Number.isNaN(n) ? null : n;
};

/**
 * Parse the confirmation details out of SAP's success Message string, e.g.:
 *   "PO-001210000168,Mat Doc-4900003184,Conf No-0000002216, Conf Counter-00000007, Insp Lot-040000001345"
 * Returns { po, mat_doc, conf_no, conf_counter, insp_lot } (raw strings) with
 * whatever tokens were present.
 */
const parseConfMessage = (message) => {
    const out = { po: null, mat_doc: null, conf_no: null, conf_counter: null, insp_lot: null };
    if (!message) return out;
    const text = String(message);

    const grab = (label) => {
        // label followed by '-' then the value up to the next comma.
        const re = new RegExp(`${label}\\s*-\\s*([^,]+)`, "i");
        const m = re.exec(text);
        return m ? m[1].trim() : null;
    };

    out.po = grab("PO");
    out.mat_doc = grab("Mat Doc");
    out.conf_no = grab("Conf No");
    out.conf_counter = grab("Conf Counter");
    out.insp_lot = grab("Insp Lot");
    return out;
};

/* ── POST with bearer token (re-login once on 401) ─────────── */

const postWithAuth = async (url, payload) => {
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
        return response.data ?? {};
    } catch (error) {
        if (error.response?.status === 401) {
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
            return response.data ?? {};
        }
        throw error;
    }
};

/* ── row fetching ──────────────────────────────────────────── */

/**
 * Fetch all pending rows (status = false) in strict FIFO order (oldest first).
 * Optionally filtered by type.
 */
const fetchPendingRows = async (type = null) => {
    const params = [];
    let where = "status = false";
    if (type) {
        params.push(type);
        where += ` AND type = $${params.length}`;
    }
    const result = await pool.query(
        `SELECT * FROM sap_transaction WHERE ${where} ORDER BY transaction_id ASC`,
        params
    );
    return result.rows;
};

/** Fetch one row by id (any status). */
const fetchRowById = async (transactionId) => {
    const result = await pool.query(
        `SELECT * FROM sap_transaction WHERE transaction_id = $1`,
        [transactionId]
    );
    return result.rows[0] || null;
};

/** Mark a set of transaction_ids as posted (status = true). */
const markRowsPosted = async (ids, client = pool) => {
    if (!ids.length) return;
    await client.query(
        `UPDATE sap_transaction
            SET status = true, updated_at = CURRENT_TIMESTAMP
          WHERE transaction_id = ANY($1::int[])`,
        [ids]
    );
};

/**
 * Record a successful FG confirmation in one DB transaction:
 *   1. mark the row's sap_transaction record status = true
 *   2. insert a row into order_conf
 *   3. bump order_hdr.gr_qty by the confirmed quantity
 *
 * @param {object} args
 * @param {number[]} args.ids            transaction_id(s) posted (usually one)
 * @param {string}   args.orderNo        prod order (unpadded)
 * @param {number}   args.operationNo    operation number
 * @param {number}   args.confirmedQty   confirmed quantity
 * @param {string}   args.fgBatch        finished-goods batch
 * @param {object}   args.conf           parsed { conf_no, conf_counter, mat_doc, insp_lot }
 * @param {boolean}  args.udRequired     whether this confirmation needs a usage decision
 */
const recordFgSuccess = async ({ ids, orderNo, operationNo, confirmedQty, fgBatch, conf, udRequired }) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await markRowsPosted(ids, client);

        await client.query(
            `INSERT INTO order_conf (
                order_no, confrmation_no, confirmation_counter, cancelling_flag,
                operation_no, confirmed_qty, gr_document, inspection_lot, fg_batch,
                ud_required
            ) VALUES ($1, $2, $3, false, $4, $5, $6, $7, $8, $9)`,
            [
                orderNo,
                toInt(conf.conf_no),
                toInt(conf.conf_counter),
                operationNo,
                confirmedQty,
                toInt(conf.mat_doc),
                toInt(conf.insp_lot),
                fgBatch,
                Boolean(udRequired),
            ]
        );

        // Add the confirmed qty to the running gr_qty on the order header.
        await client.query(
            `UPDATE order_hdr
                SET gr_qty = COALESCE(gr_qty, 0) + $1,
                    updated_at = now()
              WHERE order_no = $2`,
            [confirmedQty, orderNo]
        );

        await client.query("COMMIT");
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (_) {
            /* ignore */
        }
        throw error;
    } finally {
        client.release();
    }
};

/* ── payload builders ──────────────────────────────────────── */

/**
 * Build the FG confirmation payload for a single row.
 *
 * The row's component data (if present) rides along as a single Toitem.
 */
const buildFgPayload = (row) => {
    const toItems = [];
    if (row.comp_material_code || row.comp_batch || row.comp_quantity !== null) {
        toItems.push({
            Prod_Ord: str(row.prod_order),
            Material: str(row.comp_material_code),
            Plant: str(row.plant) || PLANT(),
            Slocation: str(row.s_location) || STORAGE_LOCATION(),
            Batch: str(row.comp_batch),
            Quantity: str(row.comp_quantity),
        });
    }

    return {
        Prod_Order: str(row.prod_order),
        Operation: padOperation(row.operation),
        Conf_Qty: str(row.conf_qty),
        FG_batch: str(row.fg_batch),
        Toitem: toItems,
    };
};

/**
 * Build the SCRAP goods-issue payload (551/201) for a single scrap row.
 * The row becomes one to_MaterialDocumentItem.
 */
const buildScrapPayload = (row) => {
    const now = new Date();
    const item = {
        Material: str(row.comp_material_code),
        Plant: str(row.plant) || PLANT(),
        StorageLocation: str(row.s_location) || STORAGE_LOCATION(),
        GoodsMovementType: SCRAP_MOVEMENT_TYPE(),
        Batch: str(row.comp_batch),
        QuantityInEntryUnit: str(row.conf_qty) || str(row.comp_quantity),
        EntryUnit: SCRAP_ENTRY_UNIT(),
        CostCenter: SCRAP_COST_CENTER(),
    };

    return {
        GoodsMovementCode: SCRAP_GOODS_MOVEMENT_CODE(),
        PostingDate: sapDate(now),
        DocumentDate: sapDate(now),
        MaterialDocumentHeaderText: "MES scrap goods issue",
        to_MaterialDocumentItem: [item],
    };
};

/* ── posting one row ───────────────────────────────────────── */

const postFgRow = async (row) => {
    const ids = [row.transaction_id];
    const payload = buildFgPayload(row);
    const udRequired = row.ud_required === true;
    const url = FG_URL();

    const fgEndpoint = process.env.SAP_FG_CONFIRMATION_ENDPOINT || "prdorderconfirmation";
    const sentOrder = unpad(payload.Prod_Order);
    const sentBatch = payload.FG_batch ?? null;

    console.log("[SAP-POST][FG] URL:", url);
    console.log("[SAP-POST][FG] Payload:", JSON.stringify(payload));

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "FG_CONFIRMATION",
            status: "FAILED",
            sap_endpoint: fgEndpoint,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: httpError.message,
            reference_type: "PROD_ORDER",
            reference_id: sentOrder,
            prod_order: sentOrder,
            batch: sentBatch,
            source_table: "sap_transaction",
            source_ids: ids,
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        throw httpError;
    }

    const durationMs = Date.now() - startedAt;

    // SAP wraps the confirmation result under Data. Success = Data.Status === 'S'.
    const data = response?.Data || {};
    const status = String(data.Status || "").toUpperCase();

    // Match the response back to what we sent (prod_order + fg_batch).
    const respOrder = unpad(data.Prod_Order);
    const respBatch = data.FG_batch ?? null;

    const orderMatches = respOrder === sentOrder;
    const batchMatches = sentBatch === null || respBatch === sentBatch;

    if (status !== "S" || !orderMatches || !batchMatches) {
        const detail = data.Message || response?.Message || "no success status returned";
        await logSapCall({
            operation: "FG_CONFIRMATION",
            status: "FAILED",
            sap_endpoint: fgEndpoint,
            sap_url: url,
            http_status_code: Number(response?.StatusCode) || null,
            sap_status: status || "E",
            message: detail,
            reference_type: "PROD_ORDER",
            reference_id: sentOrder,
            prod_order: sentOrder,
            batch: sentBatch,
            source_table: "sap_transaction",
            source_ids: ids,
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });
        throw new Error(
            `FG confirmation not successful for PO ${sentOrder}/${sentBatch}: status="${status}" ${detail}`
        );
    }

    // Parse confirmation numbers out of the success message and persist.
    const conf = parseConfMessage(data.Message);

    await logSapCall({
        operation: "FG_CONFIRMATION",
        status: "SUCCESS",
        sap_endpoint: fgEndpoint,
        sap_url: url,
        http_status_code: Number(response?.StatusCode) || null,
        sap_status: status,
        message: data.Message || response?.Message || null,
        reference_type: "PROD_ORDER",
        reference_id: sentOrder,
        prod_order: sentOrder,
        batch: sentBatch,
        material_document: conf.mat_doc,
        inspection_lot: conf.insp_lot,
        source_table: "sap_transaction",
        source_ids: ids,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });
    const confirmedQty =
        payload.Conf_Qty !== null && payload.Conf_Qty !== undefined
            ? Number(payload.Conf_Qty)
            : Number(data.Conf_Qty);

    await recordFgSuccess({
        ids,
        orderNo: sentOrder,
        operationNo: toInt(payload.Operation),
        confirmedQty,
        fgBatch: sentBatch,
        conf,
        udRequired,
    });

    return { ids, payload, response };
};

const postScrapRow = async (row) => {
    const ids = [row.transaction_id];
    const payload = buildScrapPayload(row);
    const url = SCRAP_URL();
    const scrapEndpoint = process.env.SAP_SCRAP_GOODS_ISSUE_ENDPOINT || "goods-issue-cost-center";

    console.log("[SAP-POST][SCRAP] URL:", url);
    console.log("[SAP-POST][SCRAP] Payload:", JSON.stringify(payload));

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "SCRAP_GOODS_ISSUE",
            status: "FAILED",
            sap_endpoint: scrapEndpoint,
            sap_url: url,
            movement_type: SCRAP_MOVEMENT_TYPE(),
            http_status_code: httpError.response?.status,
            message: httpError.message,
            source_table: "sap_transaction",
            source_ids: ids,
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        throw httpError;
    }

    const durationMs = Date.now() - startedAt;
    const statusCode = Number(response?.StatusCode);
    const data = response?.Data || {};
    const success = statusCode === 201 || statusCode === 200 || Boolean(data.MaterialDocument);

    if (!success) {
        const detail = response?.Message || "no success status returned";
        await logSapCall({
            operation: "SCRAP_GOODS_ISSUE",
            status: "FAILED",
            sap_endpoint: scrapEndpoint,
            sap_url: url,
            movement_type: SCRAP_MOVEMENT_TYPE(),
            http_status_code: statusCode || null,
            message: detail,
            source_table: "sap_transaction",
            source_ids: ids,
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });
        throw new Error(`Scrap goods issue not successful: ${detail}`);
    }

    await markRowsPosted(ids);

    await logSapCall({
        operation: "SCRAP_GOODS_ISSUE",
        status: "SUCCESS",
        sap_endpoint: scrapEndpoint,
        sap_url: url,
        movement_type: SCRAP_MOVEMENT_TYPE(),
        http_status_code: statusCode || null,
        message: response?.Message ?? null,
        material_document: data.MaterialDocument ?? null,
        source_table: "sap_transaction",
        source_ids: ids,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    return { ids, payload, response };
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Post all pending sap_transaction rows, ONE ROW AT A TIME in FIFO order
 * (oldest transaction_id first). Each row is a separate SAP API call, so one
 * failure does not block the rows behind it.
 *
 * @returns {object} summary of what was posted / what failed
 */
export const postPendingSapTransactions = async () => {
    const rows = await fetchPendingRows();

    const summary = {
        total_pending: rows.length,
        fg_rows_posted: 0,
        scrap_rows_posted: 0,
        skipped: 0,
        failed: 0,
        errors: [],
    };

    if (rows.length === 0) return summary;

    // Process strictly in FIFO order, one row -> one API call.
    for (const row of rows) {
        try {
            if (row.type === "FG") {
                await postFgRow(row);
                summary.fg_rows_posted += 1;
            } else if (row.type === "SCRAP") {
                await postScrapRow(row);
                summary.scrap_rows_posted += 1;
            } else {
                summary.skipped += 1;
                summary.errors.push({
                    type: row.type,
                    transaction_id: row.transaction_id,
                    message: `unsupported type "${row.type}"`,
                });
                console.warn(`[SAP-POST] Skipped transaction ${row.transaction_id}: unsupported type "${row.type}"`);
            }
        } catch (error) {
            summary.failed += 1;
            summary.errors.push({
                type: row.type,
                transaction_id: row.transaction_id,
                prod_order: row.prod_order,
                operation: row.operation,
                message: error.message,
                http_status: error.response?.status,
                sap_response: error.response?.data,
            });
            console.error(`[SAP-POST][${row.type}] Failed for transaction ${row.transaction_id}:`, error.message);
        }
    }

    return summary;
};

/**
 * Post a single sap_transaction row by its transaction_id. Only that row is
 * posted as one SAP API call.
 *
 * @param {number} transactionId
 * @returns {object} result
 */
export const postSingleSapTransaction = async (transactionId) => {
    const id = Number(transactionId);
    if (!Number.isInteger(id)) {
        throw new Error("postSingleSapTransaction: a numeric transaction_id is required");
    }

    const row = await fetchRowById(id);
    if (!row) {
        throw new Error(`sap_transaction ${id} not found`);
    }
    if (row.status === true) {
        return { posted: false, reason: "already_posted", transaction_id: id };
    }

    if (row.type === "FG") {
        const { ids, response } = await postFgRow(row);
        return { posted: true, type: "FG", transaction_ids: ids, sap_response: response };
    }

    if (row.type === "SCRAP") {
        const { ids, response } = await postScrapRow(row);
        return { posted: true, type: "SCRAP", transaction_ids: ids, sap_response: response };
    }

    throw new Error(`sap_transaction ${id} has unsupported type "${row.type}"`);
};

export default postPendingSapTransactions;
