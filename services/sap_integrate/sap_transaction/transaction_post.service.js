import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";
import { postInspectionLotUd } from "../inspection_lot/inspection_lot_ud.service.js";
import { resolveUdCode, udCodeDefault, udCodeForRew } from "../inspection_lot/ud_code.js";
import { postInspectionLotMatDoc } from "../inspection_lot/inspection_lot_matdoc.service.js";
import { postInspectionResultRecord } from "../inspection_lot/inspection_result_record.service.js";

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
const EP_MTM = () => process.env.SAP_STOCK_TRANSFER_MTM_ENDPOINT || "stock-transfer-material-to-material-01";
const EP_LTL = () =>
    process.env.SAP_STOCK_TRANSFER_LTL_ENDPOINT || "stock-transfer-from-storageloc-to-storagelocation-01";

/* full URLs */
const FG_URL = () => buildSapUrl(EP_FG());
const SCRAP_URL = () => buildSapUrl(EP_SCRAP());
const MTM_URL = () => buildSapUrl(EP_MTM());
const LTL_URL = () => buildSapUrl(EP_LTL());

/* shared defaults */
// How long to wait for SAP to respond before giving up (env-overridable).
const SAP_REQUEST_TIMEOUT_MS = Number(process.env.SAP_REQUEST_TIMEOUT_MS) || 30000;
const PLANT = () => process.env.SAP_TXN_PLANT || "1200";
const STORAGE_LOCATION = () => process.env.SAP_TXN_STORAGE_LOCATION || "1207";

/* scrap defaults */
const SCRAP_MOVEMENT_TYPE = () => process.env.SAP_SCRAP_MOVEMENT_TYPE || "551";
const SCRAP_GOODS_MOVEMENT_CODE = () => process.env.SAP_SCRAP_GOODS_MOVEMENT_CODE || "03";
const SCRAP_ENTRY_UNIT = () => process.env.SAP_SCRAP_ENTRY_UNIT || "KG";
const SCRAP_COST_CENTER = () => process.env.SAP_SCRAP_COST_CENTER || "1200000101";

/* MTM (309) defaults */
const MTM_MOVEMENT_TYPE = () => process.env.SAP_STOCK_TRANSFER_MTM_MOVEMENT_TYPE || "309";
const MTM_GOODS_MOVEMENT_CODE = () => process.env.SAP_STOCK_TRANSFER_MTM_GOODS_MOVEMENT_CODE || "04";
const MTM_ENTRY_UNIT = () => process.env.SAP_STOCK_TRANSFER_MTM_ENTRY_UNIT || "KM";
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
            timeout: SAP_REQUEST_TIMEOUT_MS,
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
                timeout: SAP_REQUEST_TIMEOUT_MS,
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
                    type, ud_type, prod_order, fg_batch, inspection_lot, ud_required,
                    status, created_at
                ) VALUES ('UD', 'UD1', $1, $2, $3, true, false, current_timestamp)`,
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

   const buildFgPayload = (row) => {
    /** FG confirmation payload. Component data (if present) becomes one Toitem. */
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

    const payload = {
        Prod_Order: str(row.prod_order),
        Operation: padOperation(row.operation),
        Conf_Qty: str(row.conf_qty),
        FG_batch: str(row.fg_batch),
    };

    if (row.fg_location) {
        payload.FG_sloc = str(row.fg_location);
    }

    payload.Toitem = toItems;

    return payload;
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
        StorageLocation: str(row.s_location) || "D2N2",
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
        MaterialDocumentHeaderText: "MTM",
        to_MaterialDocumentItem: [item],
    };
};

/**
 * After a successful MTM (309) transfer, queue a follow-up UD row in the SAME
 * transactions table. Unlike LTL (which fans out to UD2/UD3/UD4/UD5), MTM has
 * exactly one follow-up lane, so ud_type is always 'UD6' — no row-level
 * ud_type check or location-based inference needed.
 *
 * fg_batch on the follow-up row is the MTM row's comp_batch (the bobbin_no
 * carried on the transfer). The inspection_lot is resolved in this order:
 *
 *   1. response.Data02.InspLot — SAP's MTM response (same Data01/Data02 shape
 *      as LTL) echoes the inspection lot back directly.
 *   2. order_conf, looked up by fg_batch — fallback for as long as SAP's MTM
 *      response does not carry the lot.
 *
 * If neither source has a lot yet, the follow-up row is skipped (it can never
 * be posted without one) and a warning is logged; nothing throws, so the MTM
 * row itself still posts normally.
 *
 * @param {object} row       the MTM transactions row that was just posted
 * @param {object} response  the raw SAP response for this MTM post
 * @returns {Promise<void>}
 */
const MTM_FOLLOW_UP_UD_TYPE = "UD6";

const queueMtmFollowUpUd = async (row, response) => {
    const udType = MTM_FOLLOW_UP_UD_TYPE;

    const fgBatch = str(row.comp_batch);
    if (!fgBatch) {
        console.warn(
            `[SAP-POST][MTM] Skipping ${udType} follow-up for transaction ${row.transaction_id}: no comp_batch (bobbin_no) on the row`
        );
        return;
    }

    // 1. Prefer the inspection lot echoed back by SAP on the MTM response itself.
    const responseData01 = response?.Data01 || response?.Data || {};
    const responseData02 = response?.Data02 || {};
    let inspLot = toInt(
        responseData02.InspLot ??
            responseData01.InspectionLot ??
            responseData01.InspLot ??
            responseData01.Insp_Lot
    );

    // 2. Fallback: order_conf, until SAP's MTM response reliably carries the lot.
    if (inspLot === null) {
        const lotResult = await pool.query(
            `SELECT inspection_lot
               FROM order_conf
              WHERE fg_batch = $1
                AND inspection_lot IS NOT NULL
                AND inspection_lot <> 0
              ORDER BY order_conf_id DESC
              LIMIT 1`,
            [fgBatch]
        );
        inspLot = toInt(lotResult.rows[0]?.inspection_lot);
    }

    if (inspLot === null) {
        console.warn(
            `[SAP-POST][MTM] Skipping ${udType} follow-up for transaction ${row.transaction_id}: no inspection_lot available (checked SAP response and order_conf) for bobbin "${fgBatch}"`
        );
        return;
    }

    await pool.query(
        `INSERT INTO transactions (
            type, ud_type, fg_batch, inspection_lot, ud_required,
            status, created_at
        ) VALUES ('UD', $1, $2, $3, true, false, current_timestamp)`,
        [udType, fgBatch, inspLot]
    );

    console.log(
        `[SAP-POST][MTM] Queued ${udType} follow-up for bobbin "${fgBatch}" (inspection_lot ${inspLot}) from transaction ${row.transaction_id}`
    );
};

/**
 * After a successful LTL (311) transfer, queue a follow-up UD row in the SAME
 * transactions table. The follow-up's ud_type is resolved in this order:
 *
 *   1. row.ud_type on the LTL row itself, when it's one of UD2/UD3/UD4/UD5 —
 *      this is the source of truth going forward: whoever inserts the LTL row
 *      (e.g. d2_issue.service.js, qc_out.service.js, fg_color.service.js,
 *      fg_rewind.service.js) tags it with the ud_type it expects, so the
 *      follow-up always matches the LTL row's own intent even if the same
 *      location pair is reused for something else later.
 *        UD2 -> issue-to-D2 lane (d2_issue)
 *        UD3 -> QC-out lane (qc_out)
 *        UD4 -> coloring lane (fg_color)
 *        UD5 -> rewinding lane (fg_rewind)
 *   2. Fallback (legacy rows with no ud_type set): the from/to location pair —
 *        from 1207 -> to D2N2   =>  ud_type = 'UD2'  (issue-to-D2 lane)
 *        from D2N2 -> to 1206   =>  ud_type = 'UD3'  (QC-out lane)
 *      Any other from/to combination is left alone — no follow-up row. Note
 *      UD4/UD5 have no location-based fallback since fg_color/fg_rewind both
 *      use the same 1206->1207 pair; those rows must set ud_type explicitly.
 *
 * fg_batch on the follow-up row is the LTL row's comp_batch (the bobbin_no
 * carried on the transfer). The inspection_lot is resolved in this order:
 *
 *   1. response.Data.InspectionLot (or InspLot / Insp_Lot) — SAP's LTL
 *      response is expected to start echoing the inspection lot back once
 *      that field is added upstream.
 *   2. order_conf, looked up by fg_batch — fallback for as long as SAP's LTL
 *      response does not yet carry the lot (populated by the FG confirmation
 *      flow).
 *
 * If neither source has a lot yet, the follow-up row is skipped (it can never
 * be posted without one) and a warning is logged; nothing throws, so the LTL
 * row itself still posts normally.
 *
 * @param {object} row       the LTL transactions row that was just posted
 * @param {object} response  the raw SAP response for this LTL post
 * @returns {Promise<void>}
 */
const LTL_FOLLOW_UP_UD_TYPES = new Set(["UD2", "UD3", "UD4", "UD5"]);

const queueLtlFollowUpUd = async (row, response) => {
    // 1. Trust the LTL row's own ud_type when it's already one we follow up on.
    const rowUdType = String(row.ud_type || "").trim().toUpperCase() || null;

    let udType = null;
    if (rowUdType && LTL_FOLLOW_UP_UD_TYPES.has(rowUdType)) {
        udType = rowUdType;
    } else if (!rowUdType) {
        // 2. Legacy fallback for LTL rows created before ud_type was set:
        //    infer it from the from/to location pair.
        const from = str(row.s_location);
        const to = str(row.receiving_s_location);

        if (from === "1207" && to === "D2N2") {
            udType = "UD2";
        } else if (from === "D2N2" && to === "1206") {
            udType = "UD3";
        }
    }
    // else: row.ud_type is set to something else (e.g. 'UD1' or an unknown
    // value) — leave udType null so we don't misclassify it via location.

    if (!udType) return; // not a lane we follow up on

    const fgBatch = str(row.comp_batch);
    if (!fgBatch) {
        console.warn(
            `[SAP-POST][LTL] Skipping ${udType} follow-up for transaction ${row.transaction_id}: no comp_batch (bobbin_no) on the row`
        );
        return;
    }

    // 1. Prefer the inspection lot echoed back by SAP on the LTL response itself.
    //    SAP returns it on Data02.InspLot (Data01 carries the material document
    //    header instead). Older/alternate shapes are still checked as fallbacks.
    const responseData01 = response?.Data01 || response?.Data || {};
    const responseData02 = response?.Data02 || {};
    let inspLot = toInt(
        responseData02.InspLot ??
            responseData01.InspectionLot ??
            responseData01.InspLot ??
            responseData01.Insp_Lot
    );

    // 2. Fallback: order_conf, until SAP's LTL response reliably carries the lot.
    if (inspLot === null) {
        const lotResult = await pool.query(
            `SELECT inspection_lot
               FROM order_conf
              WHERE fg_batch = $1
                AND inspection_lot IS NOT NULL
                AND inspection_lot <> 0
              ORDER BY order_conf_id DESC
              LIMIT 1`,
            [fgBatch]
        );
        inspLot = toInt(lotResult.rows[0]?.inspection_lot);
    }

    if (inspLot === null) {
        console.warn(
            `[SAP-POST][LTL] Skipping ${udType} follow-up for transaction ${row.transaction_id}: no inspection_lot available (checked SAP response and order_conf) for bobbin "${fgBatch}"`
        );
        return;
    }

    await pool.query(
        `INSERT INTO transactions (
            type, ud_type, fg_batch, inspection_lot, ud_required,
            status, created_at
        ) VALUES ('UD', $1, $2, $3, true, false, current_timestamp)`,
        [udType, fgBatch, inspLot]
    );

    console.log(
        `[SAP-POST][LTL] Queued ${udType} follow-up for bobbin "${fgBatch}" (inspection_lot ${inspLot}) from transaction ${row.transaction_id}`
    );
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
    // SAP splits the MTM response into Data01 (material document header) and
    // Data02 (Mblnr/Gjahr/InspLot/Type/Message), mirroring the LTL response
    // shape. Older/alternate flat `Data` shape is kept as a fallback.
    const data01 = response?.Data01 || response?.Data || {};
    const data02 = response?.Data02 || {};
    const materialDocument = data01.MaterialDocument ?? data02.Mblnr ?? null;
    const success =
        statusCode === 201 ||
        statusCode === 200 ||
        Boolean(materialDocument) ||
        String(data02.Type || "").toUpperCase() === "S";

    if (!success) {
        const detail = data02.Message || response?.Message || "no success status returned";
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
        message: data02.Message || response?.Message || null,
        material_document: materialDocument,
        inspection_lot: toInt(data02.InspLot),
        material_code: firstMaterial,
        batch: firstBatch,
        reference_type: "MATERIAL_MOVE",
        source_table: "transactions",
        source_ids: ids,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    // Additive: queue a follow-up UD6 row for this MTM transfer. Never
    // affects the MTM row's own posted status above.
    try {
        await queueMtmFollowUpUd(row, response);
    } catch (followUpError) {
        console.error(
            `[SAP-POST][MTM] Failed to queue UD6 follow-up for transaction ${row.transaction_id}:`,
            followUpError.message
        );
    }

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
        console.log("what is the LTL response:", response)
    } catch (httpError) {
        console.error(
            "[SAP-POST][LTL] Error response:",
            JSON.stringify(httpError.response?.data)
        );
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

    console.log("[SAP-POST][LTL] Response:", JSON.stringify(response));

    const durationMs = Date.now() - startedAt;
    const statusCode = Number(response?.StatusCode);
    // SAP now splits the LTL response into Data01 (material document header)
    // and Data02 (Mblnr/Gjahr/InspLot/Type/Message). Older callers that used a
    // flat `Data` are kept as a fallback for compatibility.
    const data01 = response?.Data01 || response?.Data || {};
    const data02 = response?.Data02 || {};
    const materialDocument = data01.MaterialDocument ?? data02.Mblnr ?? null;
    const success =
        statusCode === 201 ||
        statusCode === 200 ||
        Boolean(materialDocument) ||
        String(data02.Type || "").toUpperCase() === "S";

    if (!success) {
        const detail = data02.Message || response?.Message || "no success status returned";
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
        message: data02.Message || response?.Message || null,
        material_document: materialDocument,
        inspection_lot: toInt(data02.InspLot),
        material_code: firstMaterial,
        batch: firstBatch,
        reference_type: "STOCK_TRANSFER",
        source_table: "transactions",
        source_ids: ids,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    // Additive: queue a follow-up UD row for known LTL lanes (1207->D2N2,
    // D2N2->1206). Never affects the LTL row's own posted status above.
    try {
        await queueLtlFollowUpUd(row, response);
    } catch (followUpError) {
        console.error(
            `[SAP-POST][LTL] Failed to queue UD follow-up for transaction ${row.transaction_id}:`,
            followUpError.message
        );
    }

    return { ids, payload, response };
};

/**
 * UD (inspection-lot usage decision).
 *
 * Sub-dispatches on row.ud_type when present:
 *
 *   UD1 -> resolve UD code from qc_entry.temp_grade  (WHERE bobbin_no = fg_batch).
 *          If temp_grade is missing/blank, SKIP the row (leave it pending,
 *          do not post, do not error).
 *          Sequencing: the Inspection Result Record is posted FIRST. Only when
 *          that succeeds is the UD itself posted:
 *            - Result Record fails -> UD is NOT called; this row is treated as
 *              a failure (stays pending, retried next run), same as any other
 *              SAP failure in this dispatcher.
 *            - Result Record succeeds, UD then fails -> that's a normal SAP
 *              failure for the UD call itself; behaves exactly as it already
 *              did before this change (row stays pending, retried next run).
 *   UD2 -> same lookup as UD1 but reads qc_entry.final_grade instead of
 *          temp_grade. No Result Record involved — calls UD directly.
 *   UD3 -> post UD code "A1" directly — no DB lookup at all. No Result Record
 *          involved — calls UD directly.
 *   UD4 -> coloring lane follow-up (from fg_color LTL rows) — post UD code
 *          "A1" directly, no DB lookup. No Result Record involved.
 *   UD5 -> rewinding lane follow-up (from fg_rewind LTL rows) — post UD code
 *          "A2" directly, no DB lookup.
 *   UD6 -> MTM (309) follow-up lane — post UD code "A1" directly, no DB
 *          lookup. No Result Record involved.
 *   (no ud_type) -> legacy behavior: delegate to the existing
 *          postInspectionLotUd, which resolves the UD code from the bobbin's
 *          final_grade itself and does its own SAP call + logging. No Result
 *          Record involved.
 *
 * Additionally, whenever the resolved UD_CODE is the rewind code (A2 by
 * default — see ud_code.js udCodeForRew()), regardless of which ud_type
 * produced it, the Inspection Lot Material Document Item (inspection-lot-01)
 * is posted FIRST, same gating pattern as the UD1 Result Record above:
 *   - MatlDocItem fails -> UD is NOT called; row stays pending, retried next
 *     run.
 *   - MatlDocItem succeeds, UD then fails -> normal SAP failure for the UD
 *     call itself; row stays pending, retried next run.
 * InspLotQtyPosted for that call is bobbin_entries.fiber_length looked up by
 * bobbin_no (comp_batch/fg_batch on this row).
 *
 * In every branch, the actual UD SAP call is still done via
 * postInspectionLotUd (passing an explicit UD_CODE for UD1/UD2/UD3/UD4/UD5 so
 * it does not re-resolve the grade itself); that service also handles its own
 * SAP logging. On success the transactions row is marked posted here.
 */
const postUdRow = async (row) => {
    const ids = [row.transaction_id];

    // comp_batch / fg_batch carry the bobbin_no for grade resolution.
    const bobbinNo = row.comp_batch || row.fg_batch;
    const udType = String(row.ud_type || "").trim().toUpperCase() || null;

    const lot = {
        InspectionLot: row.inspection_lot,
        bobbin_no: bobbinNo,
        type: row.ud_required ? "FTUD" : undefined,
    };

    console.log("[SAP-POST][UD] transaction:", row.transaction_id, "lot:", row.inspection_lot, "ud_type:", udType);

    if (udType === "UD1" || udType === "UD2") {
        // UD1 only: the bobbin must have completed PV (bobbin_entries.is_pv =
        // true) before its temp_grade UD can be posted. If is_pv is false (or
        // the bobbin isn't in bobbin_entries yet), SKIP this row — leave it
        // pending, do not post, do not error — so it retries once PV is done.
        if (udType === "UD1") {
            const pvResult = await pool.query(
                `SELECT is_pv FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                [bobbinNo]
            );
            const isPv = pvResult.rows[0]?.is_pv === true;

            if (!isPv) {
                console.log(
                    `[SAP-POST][UD][UD1] Skipped transaction ${row.transaction_id}: ` +
                        `bobbin_entries.is_pv is not true for bobbin_no "${bobbinNo}"`
                );
                const skipError = new Error(
                    `skip: is_pv not true in bobbin_entries for bobbin_no "${bobbinNo}"`
                );
                skipError.isSkip = true;
                throw skipError;
            }
        }

        const gradeColumn = udType === "UD1" ? "temp_grade" : "final_grade";

        const qcResult = await pool.query(
            `SELECT ${gradeColumn} AS grade FROM qc_entry WHERE bobbin_no = $1 LIMIT 1`,
            [bobbinNo]
        );

        const grade = qcResult.rows[0]?.grade;
        const hasGrade = grade !== null && grade !== undefined && String(grade).trim() !== "";

        if (!hasGrade) {
            console.log(
                `[SAP-POST][UD][${udType}] Skipped transaction ${row.transaction_id}: ` +
                    `qc_entry.${gradeColumn} not available for bobbin_no "${bobbinNo}"`
            );
            const skipError = new Error(
                `skip: ${gradeColumn} not available in qc_entry for bobbin_no "${bobbinNo}"`
            );
            skipError.isSkip = true;
            throw skipError;
        }

        lot.UD_CODE = resolveUdCode(grade);
    } else if (udType === "UD3" || udType === "UD4" || udType === "UD6") {
        // UD3 (QC-out lane), UD4 (coloring lane), and UD6 (MTM follow-up
        // lane) all post the default "accept" code directly — no DB lookup.
        lot.UD_CODE = udCodeDefault();
    } else if (udType === "UD5") {
        // UD5 (rewinding lane) always posts the "rewind" code directly.
        lot.UD_CODE = udCodeForRew();
    }
    // else: no ud_type -> legacy behavior, UD_CODE left unset so
    // postInspectionLotUd resolves it from the bobbin's final_grade itself.

    // UD1 only: Result Record must succeed BEFORE the UD is attempted. A
    // Result Record failure stops this row here — UD is not called at all,
    // and the row is treated as a failure (stays pending, retried next run).
    if (udType === "UD1") {
        try {
            await postInspectionResultRecord({ bobbinNo, inspectionLot: row.inspection_lot });
        } catch (resultRecordError) {
            console.error(
                `[SAP-POST][UD1] Inspection Result Record failed for transaction ${row.transaction_id}, ` +
                    `UD will NOT be posted:`,
                resultRecordError.message
            );
            throw resultRecordError;
        }
    }

    // Rewind code (A2) only: the Inspection Lot Material Document Item must
    // succeed BEFORE the UD is attempted (mirrors the UD1 Result Record gate
    // above). This applies whenever the resolved UD_CODE is the rewind code,
    // regardless of which ud_type produced it (UD5 directly, or UD1/UD2 when
    // the looked-up grade resolves to REW).
    //   - MatlDocItem fails -> UD is NOT called; this row is treated as a
    //     failure (stays pending, retried next run), same pattern as UD1.
    //   - MatlDocItem succeeds, UD then fails -> normal SAP failure for the
    //     UD call itself; row stays pending, retried next run.
    console.log(
        "[SAP-POST][UD] resolved UD_CODE:", lot.UD_CODE,
        "rewind code:", udCodeForRew(),
        "matdoc gate triggered:", lot.UD_CODE === udCodeForRew()
    );
    if (lot.UD_CODE === udCodeForRew()) {
        try {
            await postInspectionLotMatDoc({ bobbinNo, inspectionLot: row.inspection_lot });
        } catch (matDocError) {
            console.error(
                `[SAP-POST][UD][${udType}] Inspection Lot MatlDocItem failed for transaction ${row.transaction_id}, ` +
                    `UD will NOT be posted:`,
                matDocError.message
            );
            throw matDocError;
        }
    }

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
            // Unsupported type, or an explicit isSkip (e.g. UD1/UD2 with no
            // grade available yet), is a "skip" — everything else is a failure.
            if (error.isSkip || /unsupported transaction type/i.test(error.message)) {
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

    try {
        const { ids, response } = await dispatchRow(row);
        return {
            posted: true,
            type: String(row.type || "").trim().toUpperCase(),
            transaction_ids: ids,
            sap_response: response,
        };
    } catch (error) {
        // A skip (e.g. UD1/UD2 with no grade available yet) is not a hard
        // failure — the row stays pending and can be retried on a later run.
        if (error.isSkip) {
            return {
                posted: false,
                reason: "skipped",
                message: error.message,
                transaction_id: id,
            };
        }
        throw error;
    }
};

export default postPendingTransactions;
