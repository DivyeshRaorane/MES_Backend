import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Inspection Lot Material Document Item Service
 * ══════════════════════════════════════════════════
 *
 * Posts the "material document item" quantity for an inspection lot BEFORE
 * the usage decision (UD) is posted. This is required ahead of a UD whose
 * resolved UD_CODE is the "rewind" code (A2 by default, see
 * inspection_lot/ud_code.js -> udCodeForRew()).
 *
 *   POST {SAP_BASE_URL}/inspection-lot-01
 *   body: {
 *     "InspectionLot": "40000001460",
 *     "InspLotQtyPosted": "2",
 *     "UsageDecisionStockType": "VMENGE01"
 *   }
 *
 * InspLotQtyPosted is the bobbin's fiber_length, read from
 * bobbin_entries.fiber_length WHERE bobbin_no = <fg_batch of the UD row>.
 *
 * The upstream response wraps the real result in `Data`:
 *   {
 *     "Message": "Inspection Lot MatlDocItem processed successfully",
 *     "StatusCode": 201,
 *     "Data": { "InspectionLot": "...", "MaterialDocument": "...", ... }
 *   }
 * Unlike the UD/Result-Record endpoints, this response has no Data.Status
 * field to check — success is judged the same way LTL/MTM/SCRAP transfers
 * are: StatusCode 200/201, or a MaterialDocument present in Data.
 */

/* ══════════════════════════════════════════════════════════
   URL helper
   ══════════════════════════════════════════════════════════ */

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const MATDOC_URL = () =>
    buildSapUrl(process.env.SAP_INSPECTION_LOT_MATDOC_ENDPOINT || "inspection-lot-01");

const USAGE_DECISION_STOCK_TYPE = () =>
    process.env.SAP_INSPECTION_LOT_MATDOC_STOCK_TYPE || "VMENGE01";

/* ══════════════════════════════════════════════════════════
   value helpers
   ══════════════════════════════════════════════════════════ */

const str = (v) => (v === undefined || v === null ? null : String(v).trim());
const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

/**
 * Look up the bobbin's fiber_length to use as InspLotQtyPosted.
 *
 * @param {string} bobbinNo
 * @returns {Promise<string|null>} the fiber_length as a string, or null when
 *          the bobbin isn't found or fiber_length is null/blank
 */
const lookupFiberLength = async (bobbinNo) => {
    const result = await pool.query(
        `SELECT fiber_length FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
        [bobbinNo]
    );
    if (result.rows.length === 0) return null;

    const fiberLength = result.rows[0].fiber_length;
    if (isBlank(fiberLength)) return null;

    return String(fiberLength);
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
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Post the Inspection Lot Material Document Item for a bobbin/inspection lot.
 *
 * Never throws for "nothing to send" conditions — returns
 * { posted:false, reason } instead so callers can treat it as a skip:
 *   - no bobbinNo / inspectionLot provided
 *   - bobbin not found in bobbin_entries, or fiber_length is null/blank
 *
 * @param {object} args
 * @param {string} args.bobbinNo        fg_batch / bobbin_no
 * @param {string} args.inspectionLot
 * @returns {Promise<object>} { posted, reason?, status_code?, material_document?, sap_response? }
 * @throws only on an actual HTTP/SAP failure (network error or no success signal)
 */
export const postInspectionLotMatDoc = async ({ bobbinNo, inspectionLot }) => {
    console.log(
        "[SAP-POST][INSP-LOT-MATDOC] Called with bobbin_no:", bobbinNo,
        "inspection_lot:", inspectionLot
    );

    if (!bobbinNo) {
        console.log("[SAP-POST][INSP-LOT-MATDOC] Skipped: no bobbin_no provided");
        return { posted: false, reason: "no bobbin_no provided" };
    }
    if (!inspectionLot) {
        console.log("[SAP-POST][INSP-LOT-MATDOC] Skipped: no inspection_lot provided");
        return { posted: false, reason: "no inspection_lot provided" };
    }

    const qtyPosted = await lookupFiberLength(bobbinNo);
    console.log(
        `[SAP-POST][INSP-LOT-MATDOC] bobbin_entries.fiber_length for "${bobbinNo}":`,
        qtyPosted
    );
    if (qtyPosted === null) {
        console.log(
            `[SAP-POST][INSP-LOT-MATDOC] Skipped: bobbin "${bobbinNo}" not found or fiber_length not set`
        );
        return {
            posted: false,
            reason: `bobbin "${bobbinNo}" not found or fiber_length not set in bobbin_entries`,
        };
    }

    const payload = {
        InspectionLot: str(inspectionLot),
        InspLotQtyPosted: qtyPosted,
        UsageDecisionStockType: USAGE_DECISION_STOCK_TYPE(),
    };

    const url = MATDOC_URL();
    const endpoint = process.env.SAP_INSPECTION_LOT_MATDOC_ENDPOINT || "inspection-lot-01";

    console.log("[SAP-POST][INSP-LOT-MATDOC] URL:", url);
    console.log("[SAP-POST][INSP-LOT-MATDOC] Payload:", JSON.stringify(payload));

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        console.error(
            "[SAP-POST][INSP-LOT-MATDOC] Error response:",
            JSON.stringify(httpError.response?.data)
        );
        await logSapCall({
            operation: "INSPECTION_LOT_MATDOC",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: httpError.message,
            reference_type: "INSPECTION_LOT",
            reference_id: str(inspectionLot),
            inspection_lot: str(inspectionLot),
            batch: str(bobbinNo),
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        throw httpError;
    }

    console.log("[SAP-POST][INSP-LOT-MATDOC] Response:", JSON.stringify(response));

    const durationMs = Date.now() - startedAt;
    const statusCode = Number(response?.StatusCode);
    const data = response?.Data || {};
    const materialDocument = data.MaterialDocument ?? null;
    const success = statusCode === 201 || statusCode === 200 || Boolean(materialDocument);

    console.log(
        "[SAP-POST][INSP-LOT-MATDOC] statusCode:", statusCode,
        "materialDocument:", materialDocument,
        "success:", success
    );

    if (!success) {
        const detail = response?.Message || "no success status returned";
        await logSapCall({
            operation: "INSPECTION_LOT_MATDOC",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: statusCode || null,
            message: detail,
            reference_type: "INSPECTION_LOT",
            reference_id: str(inspectionLot),
            inspection_lot: str(inspectionLot),
            batch: str(bobbinNo),
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });

        const err = new Error(
            `Inspection Lot MatlDocItem not successful for lot ${inspectionLot}/bobbin ${bobbinNo}: ${detail}`
        );
        err.inspection_lot = inspectionLot;
        err.bobbin_no = bobbinNo;
        err.sap_response = response;
        throw err;
    }

    await logSapCall({
        operation: "INSPECTION_LOT_MATDOC",
        status: "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: url,
        http_status_code: statusCode || null,
        message: response?.Message ?? null,
        material_document: materialDocument,
        reference_type: "INSPECTION_LOT",
        reference_id: str(inspectionLot),
        inspection_lot: str(inspectionLot),
        batch: str(bobbinNo),
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    return {
        posted: true,
        status_code: statusCode,
        material_document: materialDocument,
        sap_response: response,
    };
};

export default postInspectionLotMatDoc;
