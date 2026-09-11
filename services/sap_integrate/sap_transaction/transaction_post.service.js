import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";
import { postInspectionLotUd } from "../inspection_lot/inspection_lot_ud.service.js";

/**
 * Unified SAP Transaction Posting Service
 * ═══════════════════════════════════════
 *
 * A SINGLE posting dispatcher for every SAP transaction that is queued in the
 * `transactions` table. Each row carries a `type` that selects which SAP API is
 * called (one row -> one SAP call):
 *
 *   type = 'FG'    -> POST /prdorderconfirmation
 *                     Production-order confirmation. The row's component data
 *                     (if present) rides along as a single `Toitem`. On success
 *                     it also writes order_conf and bumps order_hdr.gr_qty.
 *
 *   type = 'SCRAP' -> POST /goods-issue-cost-center
 *                     551/201 goods issue to a cost center.
 *
 *   type = 'MTM'   -> POST /stock-transfer-material-to-material   (movement 309)
 *                     Material-to-material transfer. Requires issg_or_rcvg_material.
 *
 *   type = 'LTL'   -> POST /stock-transfer-from-storageloc-to-storagelocation
 *                     Storage-location-to-storage-location transfer (movement 311).
 *
 *   type = 'UD'    -> POST /inspection-lot
 *                     Inspection-lot usage decision. Delegates to the existing
 *                     postInspectionLotUd which resolves the UD code from grade.
 *
 * Pending rows (status = false) are posted in strict FIFO order (oldest
 * transaction_id first). Each row is an independent SAP call, so one failure
 * never blocks the rows behind it; failed rows stay pending for the next run.
 *
 * Exposes:
 *   - postPendingTransactions()            post every pending row, FIFO
 *   - postSingleTransaction(transactionId) post one row by id
 */

/* ══════════════════════════════════════════════════════════
   URL + env helpers
   ══════════════════════════════════════════════════════════ */

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

/* endpoint names (env-overridable) */
const EP_FG = () => process.env.SAP_FG_CONFIRMATION_ENDPOINT || "prdorderconfirmation";
const EP_SCRAP = () => process.env.SAP_SCRAP_GOODS_ISSUE_ENDPOINT || "goods-issue-cost-center";
const EP_MTM = () => process.env.SAP_STOCK_TRANSFER_MTM_ENDPOINT || "stock-transfer-material-to-material";
const EP_LTL = () =>
    process.env.SAP_STOCK_TRANSFER_LTL_ENDPOINT || "stock-transfer-from-storageloc-to-storagelocation";

/* full URLs */
const FG_URL = () => buildSapUrl(EP_FG());
const SCRAP_URL = () => buildSapUrl(EP_SCRAP());
const MTM_URL = () => buildSapUrl(EP_MTM());
const LTL_URL = () => buildSapUrl(EP_LTL());

/* shared defaults */
const PLANT = () => process.env.SAP_TXN_PLANT || "1200";
const STORAGE_LOCATION = () => process.env.SAP_TXN_STORAGE_LOCATION || "1201";

/* scrap defaults */
const SCRAP_MOVEMENT_TYPE = () => process.env.SAP_SCRAP_MOVEMENT_TYPE || "551";
const SCRAP_GOODS_MOVEMENT_CODE = () => process.env.SAP_SCRAP_GOODS_MOVEMENT_CODE || "03";
const SCRAP_ENTRY_UNIT = () => process.env.SAP_SCRAP_ENTRY_UNIT || "KG";
const SCRAP_COST_CENTER = () => process.env.SAP_SCRAP_COST_CENTER || "1200000101";

/* MTM (309) defaults */
const MTM_MOVEMENT_TYPE = () => process.env.SAP_STOCK_TRANSFER_MTM_MOVEMENT_TYPE || "309";
const MTM_GOODS_MOVEMENT_CODE = () => process.env.SAP_STOCK_TRANSFER_MTM_GOODS_MOVEMENT_CODE || "04";
const MTM_ENTRY_UNIT = () => process.env.SAP_STOCK_TRANSFER_MTM_ENTRY_UNIT || "KG";
const MATERIAL_MOVE_QTY_FALLBACK = () => process.env.SAP_MATERIAL_MOVE_QTY || "1";

/* LTL (311) defaults */
const LTL_MOVEMENT_TYPE = () => process.env.SAP_STOCK_TRANSFER_LTL_MOVEMENT_TYPE || "311";
const LTL_GOODS_MOVEMENT_CODE = () => process.env.SAP_STOCK_TRANSFER_LTL_GOODS_MOVEMENT_CODE || "04";
const LTL_ENTRY_UNIT = () => process.env.SAP_STOCK_TRANSFER_LTL_ENTRY_UNIT || "KG";

/* ══════════════════════════════════════════════════════════
   value helpers
   ══════════════════════════════════════════════════════════ */

// Convert a numeric-ish DB value to a plain string (SAP payloads use strings).
const str = (v) => (v === undefined || v === null ? null : String(v));

// SAP OData date: /Date(<epoch ms>)/ for a given JS Date (defaults now).
const sapDate = (d = new Date()) => {
    const date = d instanceof Date ? d : new Date(d);
    return `/Date(${date.getTime()})/`;
};

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
 */
const parseConfMessage = (message) => {
    const out = { po: null, mat_doc: null, conf_no: null, conf_counter: null, insp_lot: null };
    if (!message) return out;
    const text = String(message);
    const grab = (label) => {
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

/* ══════════════════════════════════════════════════════════
   POST with bearer token (re-login once on 401)
   ══════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════
   row fetching + status updates
   ══════════════════════════════════════════════════════════ */

/** Fetch all pending rows (status = false) in strict FIFO order (oldest first). */
const fetchPendingRows = async (type = null) => {
    const params = [];
    let where = "COALESCE(status, false) = false";
    if (type) {
        params.push(type);
        where += ` AND type = $${params.length}`;
    }
    const result = await pool.query(
        `SELECT * FROM transactions WHERE ${where} ORDER BY transaction_id ASC`,
        params
    );
    return result.rows;
};

/** Fetch one row by id (any status). */
const fetchRowById = async (transactionId) => {
    const result = await pool.query(
        `SELECT * FROM transactions WHERE transaction_id = $1`,
        [transactionId]
    );
    return result.rows[0] || null;
};

/** Mark a set of transaction_ids as posted (status = true). */
const markRowsPosted = async (ids, client = pool) => {
    if (!ids.length) return;
    await client.query(
        `UPDATE transactions
            SET status = true, updated_at = CURRENT_TIMESTAMP
          WHERE transaction_id = ANY($1::int[])`,
        [ids]
    );
};

/**
 * Record a successful FG confirmation in one DB transaction:
 *   1. mark the transactions row status = true
 *   2. insert a row into order_conf
 *   3. bump order_hdr.gr_qty by the confirmed quantity
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

        await client.query(
            `UPDATE order_hdr
                SET gr_qty = COALESCE(gr_qty, 0) + $1,
                    updated_at = now()
              WHERE order_no = $2`,
            [confirmedQty, orderNo]
        );

        // When this FG confirmation needs a usage decision, queue a follow-up
        // UD row in the SAME transactions table so the scheduler posts it to the
        // inspection-lot endpoint on a later run. Only queue when SAP actually
        // returned an inspection lot (a UD with no lot cannot be posted).
        const inspLot = toInt(conf.insp_lot);
        if (udRequired && inspLot !== null) {
            await client.query(
                `INSERT INTO transactions (
                    type, prod_order, fg_batch, inspection_lot, ud_required,
                    status, created_at
                ) VALUES ('UD', $1, $2, $3, true, false, current_timestamp)`,
                [orderNo, fgBatch, inspLot]
            );
        }

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

/* ══════════════════════════════════════════════════════════
   payload builders (one per type)
   ══════════════════════════════════════════════════════════ */

/** FG confirmation payload. Component data (if present) becomes one Toitem. */
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

/** SCRAP goods-issue payload (551/201). The row becomes one to_MaterialDocumentItem. */
const buildScrapPayload = (row) => {
    const now = new Date();
    const item = {
        Material: str(row.comp_material_code),
        Plant: str(row.plant) || PLANT(),
        StorageLocation: str(row.s_location) || STORAGE_LOCATION(),
        GoodsMovementType: SCRAP_MOVEMENT_TYPE(),
        Batch: str(row.comp_batch),
        QuantityInEntryUnit: str(row.conf_qty) || str(row.comp_quantity),
        EntryUnit: str(row.uom) || SCRAP_ENTRY_UNIT(),
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

/** MTM (309) material-to-material payload. Requires issg_or_rcvg_material. */
const buildMtmPayload = (row) => {
    const now = new Date();

    const qty =
        row.comp_quantity === null || row.comp_quantity === undefined || String(row.comp_quantity).trim() === ""
            ? MATERIAL_MOVE_QTY_FALLBACK()
            : row.comp_quantity;

    const item = {
        Material: str(row.comp_material_code),
        Plant: str(row.plant) || PLANT(),
        StorageLocation: str(row.s_location) || STORAGE_LOCATION(),
        GoodsMovementType: MTM_MOVEMENT_TYPE(),
        Batch: str(row.comp_batch),
        QuantityInEntryUnit: str(qty),
        EntryUnit: str(row.uom) || MTM_ENTRY_UNIT(),
        IssgOrRcvgMaterial: str(row.issg_or_rcvg_material),
    };

    // Optional receiving-side fields (only added when supplied).
    if (str(row.receiving_batch)) item.IssuingOrReceivingBatch = str(row.receiving_batch);
    if (str(row.receiving_plant)) item.IssuingOrReceivingPlant = str(row.receiving_plant);
    if (str(row.receiving_s_location)) item.IssuingOrReceivingStorageLoc = str(row.receiving_s_location);

    return {
        GoodsMovementCode: MTM_GOODS_MOVEMENT_CODE(),
        PostingDate: sapDate(now),
        DocumentDate: sapDate(now),
        MaterialDocumentHeaderText: "MES material to material transfer",
        to_MaterialDocumentItem: [item],
    };
};

/** LTL (311) location-to-location payload. Requires receiving_s_location. */
const buildLtlPayload = (row) => {
    const now = new Date();
    const plant = str(row.plant) || PLANT();

    const item = {
        Material: str(row.comp_material_code),
        Plant: plant,
        StorageLocation: str(row.s_location) || STORAGE_LOCATION(),
        Batch: str(row.comp_batch),
        GoodsMovementType: LTL_MOVEMENT_TYPE(),
        // Receiving plant falls back to the issuing plant when not provided.
        IssuingOrReceivingPlant: str(row.receiving_plant) || plant,
        IssuingOrReceivingStorageLoc: str(row.receiving_s_location),
        QuantityInEntryUnit: str(row.comp_quantity),
        EntryUnit: str(row.uom) || LTL_ENTRY_UNIT(),
    };

    return {
        GoodsMovementCode: LTL_GOODS_MOVEMENT_CODE(),
        PostingDate: sapDate(now),
        DocumentDate: sapDate(now),
        MaterialDocumentHeaderText: "MES",
        to_MaterialDocumentItem: [item],
    };
};

/* ══════════════════════════════════════════════════════════
   per-type posters (one row -> one SAP call)
   ══════════════════════════════════════════════════════════ */

const postFgRow = async (row) => {
    const ids = [row.transaction_id];
    const payload = buildFgPayload(row);
    const udRequired = row.ud_required === true;
    const url = FG_URL();
    const endpoint = EP_FG();

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
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: httpError.message,
            reference_type: "PROD_ORDER",
            reference_id: sentOrder,
            prod_order: sentOrder,
            batch: sentBatch,
            source_table: "transactions",
            source_ids: ids,
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        throw httpError;
    }

    const durationMs = Date.now() - startedAt;
    const data = response?.Data || {};
    const status = String(data.Status || "").toUpperCase();

    const respOrder = unpad(data.Prod_Order);
    const respBatch = data.FG_batch ?? null;
    const orderMatches = respOrder === sentOrder;
    const batchMatches = sentBatch === null || respBatch === sentBatch;

    if (status !== "S" || !orderMatches || !batchMatches) {
        const detail = data.Message || response?.Message || "no success status returned";
        await logSapCall({
            operation: "FG_CONFIRMATION",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: Number(response?.StatusCode) || null,
            sap_status: status || "E",
            message: detail,
            reference_type: "PROD_ORDER",
            reference_id: sentOrder,
            prod_order: sentOrder,
            batch: sentBatch,
            source_table: "transactions",
            source_ids: ids,
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });
        throw new Error(
            `FG confirmation not successful for PO ${sentOrder}/${sentBatch}: status="${status}" ${detail}`
        );
    }

    const conf = parseConfMessage(data.Message);

    await logSapCall({
        operation: "FG_CONFIRMATION",
        status: "SUCCESS",
        sap_endpoint: endpoint,
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
        source_table: "transactions",
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
    const endpoint = EP_SCRAP();

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
            sap_endpoint: endpoint,
            sap_url: url,
            movement_type: SCRAP_MOVEMENT_TYPE(),
            http_status_code: httpError.response?.status,
            message: httpError.message,
            source_table: "transactions",
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
            sap_endpoint: endpoint,
            sap_url: url,
            movement_type: SCRAP_MOVEMENT_TYPE(),
            http_status_code: statusCode || null,
            message: detail,
            source_table: "transactions",
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
        sap_endpoint: endpoint,
        sap_url: url,
        movement_type: SCRAP_MOVEMENT_TYPE(),
        http_status_code: statusCode || null,
        message: response?.Message ?? null,
        material_document: data.MaterialDocument ?? null,
        source_table: "transactions",
        source_ids: ids,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    return { ids, payload, response };
};

const postMtmRow = async (row) => {
    const ids = [row.transaction_id];

    if (!str(row.issg_or_rcvg_material)) {
        throw new Error(
            `MTM transfer requires issg_or_rcvg_material (transaction ${row.transaction_id})`
        );
    }

    const payload = buildMtmPayload(row);
    const url = MTM_URL();
    const endpoint = EP_MTM();

    const firstMaterial = payload.to_MaterialDocumentItem?.[0]?.Material ?? null;
    const firstBatch = payload.to_MaterialDocumentItem?.[0]?.Batch ?? null;

    console.log("[SAP-POST][MTM] URL:", url);
    console.log("[SAP-POST][MTM] Payload:", JSON.stringify(payload));

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "STOCK_TRANSFER_MTM",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            movement_type: MTM_MOVEMENT_TYPE(),
            http_status_code: httpError.response?.status,
            message: httpError.message,
            material_code: firstMaterial,
            batch: firstBatch,
            reference_type: "MATERIAL_MOVE",
            source_table: "transactions",
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
            operation: "STOCK_TRANSFER_MTM",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            movement_type: MTM_MOVEMENT_TYPE(),
            http_status_code: statusCode || null,
            message: detail,
            material_code: firstMaterial,
            batch: firstBatch,
            reference_type: "MATERIAL_MOVE",
            source_table: "transactions",
            source_ids: ids,
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });
        throw new Error(`Stock transfer material-to-material not successful: ${detail}`);
    }

    await markRowsPosted(ids);

    await logSapCall({
        operation: "STOCK_TRANSFER_MTM",
        status: "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: url,
        movement_type: MTM_MOVEMENT_TYPE(),
        http_status_code: statusCode || null,
        message: response?.Message ?? null,
        material_document: data.MaterialDocument ?? null,
        material_code: firstMaterial,
        batch: firstBatch,
        reference_type: "MATERIAL_MOVE",
        source_table: "transactions",
        source_ids: ids,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    return { ids, payload, response };
};

const postLtlRow = async (row) => {
    const ids = [row.transaction_id];

    if (!str(row.receiving_s_location)) {
        throw new Error(
            `LTL transfer requires receiving_s_location (transaction ${row.transaction_id})`
        );
    }

    const payload = buildLtlPayload(row);
    const url = LTL_URL();
    const endpoint = EP_LTL();

    const firstMaterial = payload.to_MaterialDocumentItem?.[0]?.Material ?? null;
    const firstBatch = payload.to_MaterialDocumentItem?.[0]?.Batch ?? null;

    console.log("[SAP-POST][LTL] URL:", url);
    console.log("[SAP-POST][LTL] Payload:", JSON.stringify(payload));

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "STOCK_TRANSFER_LTL",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            movement_type: LTL_MOVEMENT_TYPE(),
            http_status_code: httpError.response?.status,
            message: httpError.message,
            material_code: firstMaterial,
            batch: firstBatch,
            reference_type: "STOCK_TRANSFER",
            source_table: "transactions",
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
            operation: "STOCK_TRANSFER_LTL",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            movement_type: LTL_MOVEMENT_TYPE(),
            http_status_code: statusCode || null,
            message: detail,
            material_code: firstMaterial,
            batch: firstBatch,
            reference_type: "STOCK_TRANSFER",
            source_table: "transactions",
            source_ids: ids,
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });
        throw new Error(`Stock transfer location-to-location not successful: ${detail}`);
    }

    await markRowsPosted(ids);

    await logSapCall({
        operation: "STOCK_TRANSFER_LTL",
        status: "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: url,
        movement_type: LTL_MOVEMENT_TYPE(),
        http_status_code: statusCode || null,
        message: response?.Message ?? null,
        material_document: data.MaterialDocument ?? null,
        material_code: firstMaterial,
        batch: firstBatch,
        reference_type: "STOCK_TRANSFER",
        source_table: "transactions",
        source_ids: ids,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    return { ids, payload, response };
};

/**
 * UD (inspection-lot usage decision). Delegates to the existing
 * postInspectionLotUd, which resolves the UD code from the bobbin's final_grade
 * and does its own SAP call + logging. On success the transactions row is
 * marked posted here.
 */
const postUdRow = async (row) => {
    const ids = [row.transaction_id];

    const lot = {
        InspectionLot: row.inspection_lot,
        // comp_batch / fg_batch carry the bobbin_no for grade resolution.
        bobbin_no: row.comp_batch || row.fg_batch,
        type: row.ud_required ? "FTUD" : undefined,
    };

    console.log("[SAP-POST][UD] transaction:", row.transaction_id, "lot:", row.inspection_lot);

    const result = await postInspectionLotUd(lot);

    await markRowsPosted(ids);

    return { ids, payload: lot, response: result };
};

/* ══════════════════════════════════════════════════════════
   dispatcher (switch/case over type)
   ══════════════════════════════════════════════════════════ */

/**
 * Post a single row by dispatching on its `type`.
 *
 * @param {object} row  a transactions row
 * @returns {Promise<{ids:number[], payload:object, response:object}>}
 * @throws when the type is unsupported or the SAP call fails
 */
const dispatchRow = async (row) => {
    const type = String(row.type || "").trim().toUpperCase();

    switch (type) {
        case "FG":
            return postFgRow(row);
        case "SCRAP":
            return postScrapRow(row);
        case "MTM":
            return postMtmRow(row);
        case "LTL":
            return postLtlRow(row);
        case "UD":
            return postUdRow(row);
        default:
            throw new Error(`unsupported transaction type "${row.type}"`);
    }
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Post all pending `transactions` rows, ONE ROW AT A TIME in FIFO order
 * (oldest transaction_id first). Each row is a separate SAP call, so one
 * failure never blocks the rows behind it. Failed rows stay pending
 * (status = false) for the next run.
 *
 * @returns {Promise<object>} summary of what was posted / what failed
 */
export const postPendingTransactions = async () => {
    const rows = await fetchPendingRows();

    const summary = {
        total_pending: rows.length,
        posted: 0,
        by_type: { FG: 0, SCRAP: 0, MTM: 0, LTL: 0, UD: 0 },
        skipped: 0,
        failed: 0,
        errors: [],
    };

    if (rows.length === 0) return summary;

    for (const row of rows) {
        const type = String(row.type || "").trim().toUpperCase();
        try {
            await dispatchRow(row);
            summary.posted += 1;
            if (summary.by_type[type] !== undefined) summary.by_type[type] += 1;
        } catch (error) {
            // Unsupported type is a "skip", everything else is a failure.
            if (/unsupported transaction type/i.test(error.message)) {
                summary.skipped += 1;
            } else {
                summary.failed += 1;
            }
            summary.errors.push({
                type: row.type,
                transaction_id: row.transaction_id,
                prod_order: row.prod_order,
                message: error.message,
                http_status: error.response?.status,
                sap_response: error.response?.data,
            });
            console.error(
                `[SAP-POST][${row.type}] Failed for transaction ${row.transaction_id}:`,
                error.message
            );
        }
    }

    return summary;
};

/**
 * Post a single `transactions` row by its transaction_id.
 *
 * @param {number} transactionId
 * @returns {Promise<object>} result
 */
export const postSingleTransaction = async (transactionId) => {
    const id = Number(transactionId);
    if (!Number.isInteger(id)) {
        throw new Error("postSingleTransaction: a numeric transaction_id is required");
    }

    const row = await fetchRowById(id);
    if (!row) {
        throw new Error(`transactions ${id} not found`);
    }
    if (row.status === true) {
        return { posted: false, reason: "already_posted", transaction_id: id };
    }

    const { ids, response } = await dispatchRow(row);
    return {
        posted: true,
        type: String(row.type || "").trim().toUpperCase(),
        transaction_ids: ids,
        sap_response: response,
    };
};

export default postPendingTransactions;
