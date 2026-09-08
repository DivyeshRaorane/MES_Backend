import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { resolveUdCode } from "./ud_code.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Inspection Lot Usage Decision (UD) Posting Service
 *
 * Posts a Usage Decision code against an inspection lot:
 *
 *   POST {SAP_BASE_URL}/inspection-lot
 *   body: { "InspectionLot": "40000000737", "UD_CODE": "A1" }
 *
 * UD_CODE is optional on the caller side: when omitted, it is derived from the
 * bobbin's final_grade using the centralized mapping in ./ud_code.js
 * (REW -> A2, FAIL -> R3, else A1). This lets callers (e.g. the frontend) send
 * just the inspection lots and let the backend decide the code category-wise.
 *
 * The upstream service replies with a wrapper:
 *   {
 *     "Message": "Inspection Lot processed successfully",
 *     "StatusCode": 201,
 *     "Data": {
 *       "InspectionLot": "40000000737",
 *       "UD_CODE": "A1",
 *       "Status": "S" | "E",
 *       "Message": "..."
 *     }
 *   }
 *
 * Note: the outer StatusCode/Message can say "success" even when SAP rejected
 * the lot. The real result is in Data.Status ("S" = success, anything else is
 * a business error). This service treats Data.Status !== "S" as a failure.
 *
 * Optional `type` on the entry drives follow-up DB work:
 *   type = "FTUD" + Data.Status === "S"
 *      -> UPDATE order_conf SET ud = true WHERE inspection_lot = <lot>
 *
 * The service is intentionally generic so it can be dropped in anywhere:
 *   - postInspectionLotUd(lot)          -> single UD post
 *   - postInspectionLotUdBulk(lots)     -> many UD posts (independent, never
 *                                          blocks the rest on one failure)
 */

/* ── URL helper ────────────────────────────────────────────── */

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const UD_URL = () => buildSapUrl(process.env.SAP_INSPECTION_LOT_UD_ENDPOINT || "inspection-lot");

/* ── value helpers ─────────────────────────────────────────── */

const str = (v) => (v === undefined || v === null ? null : String(v).trim());

/**
 * Normalize a caller-supplied lot into the SAP payload shape plus any local
 * metadata (like `type`) that drives follow-up DB work but is NOT sent to SAP.
 * Accepts a few common key spellings so callers don't have to be exact.
 *
 * The UD_CODE is optional here: when absent it is resolved later from the
 * bobbin's final_grade (see resolveUdCodeForEntry / the centralized ud_code.js
 * mapping). A caller-supplied UD_CODE always takes precedence.
 *
 * @param {object} input
 * @returns {{
 *   payload: { InspectionLot: string, UD_CODE: string|null },
 *   type: string|null,
 *   finalGrade: string|null,
 *   bobbinNo: string|null
 * }}
 */
const normalizeLot = (input) => {
    if (!input || typeof input !== "object") {
        throw new Error("Inspection lot entry must be an object { InspectionLot, UD_CODE? }");
    }

    const inspectionLot = str(
        input.InspectionLot ?? input.inspectionLot ?? input.inspection_lot ?? input.lot
    );
    const udCode = str(input.UD_CODE ?? input.udCode ?? input.ud_code ?? input.code);
    const type = str(input.type ?? input.Type ?? input.TYPE);
    const finalGrade = str(input.final_grade ?? input.finalGrade ?? input.grade);
    const bobbinNo = str(input.bobbin_no ?? input.bobbinNo ?? input.fg_batch ?? input.FG_batch);

    if (!inspectionLot) {
        throw new Error("InspectionLot is required");
    }

    return {
        payload: { InspectionLot: inspectionLot, UD_CODE: udCode },
        type: type ? type.toUpperCase() : null,
        finalGrade,
        bobbinNo,
    };
};

/**
/**
 * Look up a bobbin's final_grade so the UD code can be derived server-side.
 *
 * A single inspection lot may cover many bobbins with DIFFERENT grades, so the
 * bobbin is the reliable resolution key. Resolution order:
 *
 *   1. an explicit bobbinNo -> that bobbin's grade (unambiguous)
 *   2. otherwise, via the inspection lot -> only usable when the lot maps to a
 *      SINGLE distinct grade. If the lot spans multiple grades we refuse rather
 *      than guess (the caller must send bobbin_no or final_grade).
 *
 * @param {object} args
 * @param {string|null} args.inspectionLot
 * @param {string|null} args.bobbinNo
 * @returns {Promise<string|null>} final_grade or null when not found
 * @throws when a lot-only lookup is ambiguous (multiple distinct grades)
 */
const lookupFinalGrade = async ({ inspectionLot, bobbinNo }) => {
    // 1. Bobbin is the precise key — one bobbin, one grade.
    if (bobbinNo) {
        const byBobbin = await pool.query(
            `SELECT final_grade FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
            [bobbinNo]
        );
        if (byBobbin.rows.length) return byBobbin.rows[0].final_grade ?? null;
        return null;
    }

    // 2. Lot-only fallback. A lot can span multiple bobbins/grades, so gather
    //    the distinct non-empty grades and only proceed when there is exactly one.
    const lotInt = parseInt(String(inspectionLot ?? "").replace(/[^\d-]/g, ""), 10);
    if (Number.isNaN(lotInt)) return null;

    const byLot = await pool.query(
        `SELECT DISTINCT btrim(be.final_grade) AS final_grade
           FROM order_conf oc
           JOIN bobbin_entries be ON be.bobbin_no = oc.fg_batch
          WHERE oc.inspection_lot = $1
            AND be.final_grade IS NOT NULL
            AND btrim(be.final_grade) <> ''`,
        [lotInt]
    );

    if (byLot.rows.length === 0) return null;
    if (byLot.rows.length > 1) {
        const grades = byLot.rows.map((r) => r.final_grade).join(", ");
        throw new Error(
            `Inspection lot ${lotInt} maps to multiple grades [${grades}]; ` +
                `send bobbin_no (or final_grade / UD_CODE) per entry so the UD code is unambiguous`
        );
    }
    return byLot.rows[0].final_grade ?? null;
};

/**
 * Ensure a normalized entry has a UD_CODE. If the caller supplied one it is
 * kept as-is; otherwise the code is derived from the bobbin's final_grade
 * (explicit on the entry, or looked up from the DB per bobbin) via resolveUdCode.
 *
 * @param {{ payload: object, finalGrade: string|null, bobbinNo: string|null }} normalized
 * @returns {Promise<object>} the normalized object with payload.UD_CODE filled in
 */
const resolveUdCodeForEntry = async (normalized) => {
    if (normalized.payload.UD_CODE) return normalized;

    let grade = normalized.finalGrade;
    if (!grade) {
        grade = await lookupFinalGrade({
            inspectionLot: normalized.payload.InspectionLot,
            bobbinNo: normalized.bobbinNo,
        });
    }

    if (!grade) {
        throw new Error(
            `UD_CODE is required and could not be resolved: no final_grade found for ` +
                `InspectionLot "${normalized.payload.InspectionLot}"` +
                (normalized.bobbinNo ? ` / bobbin "${normalized.bobbinNo}"` : "") +
                `. Send bobbin_no or final_grade (or an explicit UD_CODE).`
        );
    }

    normalized.payload.UD_CODE = resolveUdCode(grade);
    return normalized;
};

/* ── follow-up DB work ─────────────────────────────────────── */

/**
 * Mark the usage decision as done on order_conf for an FTUD entry.
 * inspection_lot is an int column, so match numerically.
 *
 * A single lot can cover many bobbins, so when a bobbin (fg_batch) is known the
 * update is scoped to that bobbin's row only — otherwise all rows sharing the
 * lot would be flipped at once. Without a bobbin it falls back to lot-only.
 *
 * @param {string} inspectionLot
 * @param {string|null} [bobbinNo]  fg_batch of the specific bobbin, when known
 * @returns {Promise<number>} number of order_conf rows updated
 */
const markOrderConfUd = async (inspectionLot, bobbinNo = null) => {
    const lotInt = parseInt(String(inspectionLot).replace(/[^\d-]/g, ""), 10);
    if (Number.isNaN(lotInt)) {
        console.warn(`[SAP-POST][UD] FTUD: inspection lot "${inspectionLot}" is not numeric, skipping order_conf update`);
        return 0;
    }

    const scoped = bobbinNo != null && String(bobbinNo).trim() !== "";
    const result = await pool.query(
        scoped
            ? `UPDATE order_conf SET ud = true WHERE inspection_lot = $1 AND fg_batch = $2`
            : `UPDATE order_conf SET ud = true WHERE inspection_lot = $1`,
        scoped ? [lotInt, String(bobbinNo).trim()] : [lotInt]
    );

    const scope = scoped ? `${lotInt}/${bobbinNo}` : `${lotInt}`;
    const updated = result.rowCount || 0;
    if (updated === 0) {
        console.warn(`[SAP-POST][UD] FTUD: no order_conf row found for inspection_lot ${scope}`);
    } else {
        console.log(`[SAP-POST][UD] FTUD: order_conf.ud = true for inspection_lot ${scope} (${updated} row(s))`);
    }
    return updated;
};

/**
 * Store the confirmed UD_CODE (as returned by SAP on a successful decision) on
 * the bobbin's bobbin_entries row, keyed by bobbin_no (= fg_batch).
 *
 * @param {string|null} bobbinNo  fg_batch / bobbin_no of the bobbin
 * @param {string|null} udCode    the UD code to store (e.g. "A2")
 * @returns {Promise<number>} number of bobbin_entries rows updated
 */
const markBobbinUdGrade = async (bobbinNo, udCode) => {
    
    const bobbin = str(bobbinNo);
    const code = str(udCode);
    if (!bobbin) {
        console.warn(`[SAP-POST][UD] Cannot store ud_grade: no bobbin_no provided (code "${code}")`);
        return 0;
    }
    if (!code) {
        console.warn(`[SAP-POST][UD] Cannot store ud_grade for bobbin ${bobbin}: no UD_CODE available`);
        return 0;
    }

    const result = await pool.query(
        `UPDATE bobbin_entries SET ud_grade = $1 WHERE bobbin_no = $2`,
        [code, bobbin]
    );

    const updated = result.rowCount || 0;
    if (updated === 0) {
        console.warn(`[SAP-POST][UD] No bobbin_entries row found for bobbin_no ${bobbin} to store ud_grade`);
    } else {
        console.log(`[SAP-POST][UD] bobbin_entries.ud_grade = "${code}" for bobbin_no ${bobbin} (${updated} row(s))`);
    }
    return updated;
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

/* ── response interpretation ───────────────────────────────── */

/**
 * Inspect the upstream response and decide success/failure.
 * Success = Data.Status === "S".
 *
 * @param {object} response  raw upstream response body
 * @param {object} payload   what we sent
 * @returns {{ success: boolean, status: string, message: string, data: object }}
 */
const interpretResponse = (response, payload) => {
    const data = response?.Data || {};
    const status = String(data.Status || "").toUpperCase();
    const message = data.Message || response?.Message || "";
    return {
        success: status === "S",
        status,
        message,
        data,
    };
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Post a single inspection lot usage decision.
 *
 * @param {object} lot  { InspectionLot, UD_CODE?, type?, final_grade?, bobbin_no? }
 *                       (key spelling is flexible). `type` is local metadata
 *                       (not sent to SAP); "FTUD" triggers the order_conf.ud
 *                       update on success. When UD_CODE is omitted it is derived
 *                       from the bobbin's final_grade via the centralized
 *                       ud_code.js mapping (REW->A2, FAIL->R3, else A1).
 * @returns {Promise<object>} {
 *   posted, inspection_lot, ud_code, type, status, message,
 *   order_conf_updated?, sap_response
 * }
 * @throws when the input is invalid, the HTTP call fails, or SAP rejects the
 *         lot (Data.Status !== "S").
 */
export const postInspectionLotUd = async (lot) => {
    console.log("UD schedular running")
    const normalized = await resolveUdCodeForEntry(normalizeLot(lot));
    const { payload, type } = normalized;
    const url = UD_URL();

    console.log("[SAP-POST][UD] URL:", url);
    console.log("[SAP-POST][UD] Payload:", JSON.stringify(payload), "type:", type);

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        // Network / HTTP failure before we could interpret a SAP body.
        await logSapCall({
            operation: "INSPECTION_LOT_UD",
            status: "FAILED",
            sap_endpoint: process.env.SAP_INSPECTION_LOT_UD_ENDPOINT || "inspection-lot",
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: httpError.message,
            reference_type: "INSPECTION_LOT",
            reference_id: payload.InspectionLot,
            inspection_lot: payload.InspectionLot,
            batch: normalized.bobbinNo,
            request_payload: payload,
            response_payload: httpError.response?.data,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        throw httpError;
    }

    const result = interpretResponse(response, payload);
    const durationMs = Date.now() - startedAt;

    if (!result.success) {
        await logSapCall({
            operation: "INSPECTION_LOT_UD",
            status: "FAILED",
            sap_endpoint: process.env.SAP_INSPECTION_LOT_UD_ENDPOINT || "inspection-lot",
            sap_url: url,
            http_status_code: Number(response?.StatusCode) || null,
            sap_status: result.status || "E",
            message: result.message || "no success status returned",
            reference_type: "INSPECTION_LOT",
            reference_id: payload.InspectionLot,
            inspection_lot: payload.InspectionLot,
            batch: normalized.bobbinNo,
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });

        const err = new Error(
            `Inspection lot UD not successful for ${payload.InspectionLot}/${payload.UD_CODE}: ` +
                `status="${result.status}" ${result.message || "no success status returned"}`
        );
        err.inspection_lot = payload.InspectionLot;
        err.ud_code = payload.UD_CODE;
        err.sap_response = response;
        throw err;
    }

    // FTUD entries: on SAP success, flag the usage decision on order_conf.
    // Scope to the specific bobbin when known so sibling bobbins on the same
    // lot are not marked done prematurely.
    let orderConfUpdated;
    let bobbinUdGradeUpdated;
    if (type === "FTUD") {
        orderConfUpdated = await markOrderConfUd(payload.InspectionLot, normalized.bobbinNo);

        // Store the confirmed UD code on the bobbin (bobbin_no = fg_batch).
        // Prefer the code SAP echoed back in Data.UD_CODE; fall back to sent.
        const confirmedUdCode = result.data?.UD_CODE || payload.UD_CODE;
        console.log(">>>>>bobbin_no", normalized, result.data?.UD_CODE)
        bobbinUdGradeUpdated = await markBobbinUdGrade(normalized.bobbinNo, confirmedUdCode);
    }

    await logSapCall({
        operation: "INSPECTION_LOT_UD",
        status: "SUCCESS",
        sap_endpoint: process.env.SAP_INSPECTION_LOT_UD_ENDPOINT || "inspection-lot",
        sap_url: url,
        http_status_code: Number(response?.StatusCode) || null,
        sap_status: result.status,
        message: result.message,
        reference_type: "INSPECTION_LOT",
        reference_id: payload.InspectionLot,
        inspection_lot: payload.InspectionLot,
        batch: normalized.bobbinNo,
        request_payload: payload,
        response_payload: response,
        duration_ms: durationMs,
    });

    return {
        posted: true,
        inspection_lot: payload.InspectionLot,
        ud_code: payload.UD_CODE,
        type,
        status: result.status,
        message: result.message,
        ...(orderConfUpdated !== undefined && { order_conf_updated: orderConfUpdated }),
        ...(bobbinUdGradeUpdated !== undefined && { bobbin_ud_grade_updated: bobbinUdGradeUpdated }),
        sap_response: response,
    };
};

/**
 * Post many inspection lot usage decisions.
 *
 * Each lot is posted independently: one failure does not stop the others.
 * Returns a summary plus per-lot results so the caller can see exactly which
 * lots went through and which didn't.
 *
 * @param {object[]} lots  array of { InspectionLot, UD_CODE?, type?, final_grade?, bobbin_no? }.
 *                          UD_CODE is optional per entry; when omitted it is
 *                          derived from the bobbin's final_grade.
 * @returns {Promise<object>} {
 *   total, posted, failed, results[], errors[]
 * }
 */
export const postInspectionLotUdBulk = async (lots) => {
    if (!Array.isArray(lots)) {
        throw new Error("postInspectionLotUdBulk expects an array of { InspectionLot, UD_CODE? }");
    }

    const summary = {
        total: lots.length,
        posted: 0,
        failed: 0,
        results: [],
        errors: [],
    };

    for (const [index, lot] of lots.entries()) {
        try {
            const result = await postInspectionLotUd(lot);
            summary.posted += 1;
            summary.results.push(result);
        } catch (error) {
            summary.failed += 1;
            summary.errors.push({
                index,
                inspection_lot: error.inspection_lot ?? lot?.InspectionLot ?? null,
                ud_code: error.ud_code ?? lot?.UD_CODE ?? null,
                message: error.message,
                http_status: error.response?.status,
                sap_response: error.sap_response ?? error.response?.data,
            });
            console.error("[SAP-POST][UD] Failed:", error.message);
        }
    }

    return summary;
};

/**
 * Convenience entry point: accepts either a single lot object or an array.
 * Handy when the caller doesn't know upfront whether it's a single or bulk
 * entry (e.g. a request body that may be one object or a list).
 *
 * @param {object|object[]} input
 * @returns {Promise<object>} single result (object input) or bulk summary (array input)
 */
export const postInspectionLotUdFlexible = async (input) => {
    if (Array.isArray(input)) {
        return postInspectionLotUdBulk(input);
    }
    return postInspectionLotUd(input);
};

export default postInspectionLotUdFlexible;
