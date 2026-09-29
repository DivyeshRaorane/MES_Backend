import axios from "axios";
import pool from "../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../auth/sap_auth.service.js";
import { logSapCall } from "../sap_log.service.js";

/**
 * SAP Inspection Result Record Service
 * ════════════════════════════════════
 *
 * Posts characteristic-level inspection results for an inspection lot:
 *
 *   POST {SAP_BASE_URL}/api/sap/dev/Inspection-Result-Record
 *   body: {
 *     "InspectionLot": "040000000769",
 *     "Operation": "0010",
 *     "Toitem": [
 *       { "InspectionLot": "...", "Operation": "0010", "Inspchar": "0010",
 *         "Code": "A", "Codegroup": "VISUAL", "Meanvalue": "10" },
 *       ...
 *     ]
 *   }
 *
 * `Operation` is always fixed at "0010" (header and every Toitem row).
 *
 * The characteristic set (Inspchar codes) sent depends on the bobbin's fiber
 * type, resolved from bobbin_entries.fiber_color:
 *   - "NATURAL" (case-insensitive)       -> NATURAL_CHAR_MAP
 *   - anything else, non-null/non-blank  -> COLORED_CHAR_MAP
 *
 * Inspchar is confirmed and fixed per parameter (0010, 0020, 0030 ... 0270,
 * following the parameter order given for NATURAL_CHAR_MAP below).
 *
 * IMPORTANT — remaining placeholder values:
 *   Code / Codegroup are still placeholders copied from the sample payload
 *   ("A" / "VISUAL") for EVERY parameter, since per-parameter values for
 *   those have not been supplied yet. Update NATURAL_CHAR_MAP if they turn
 *   out to differ per parameter.
 *
 * Values come from qc_entry_temp (by bobbin_no = fg_batch). For every
 * "_top" column referenced below, the value falls back to the matching
 * "_bottom" column when "_top" is null/blank (mirrors the top/bottom borrowing
 * rule already used in qc_grade.service.js).
 */

/* ══════════════════════════════════════════════════════════
   URL helper
   ══════════════════════════════════════════════════════════ */

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const RESULT_RECORD_URL = () =>
    buildSapUrl(process.env.SAP_INSPECTION_RESULT_RECORD_ENDPOINT || "Inspection-Result-Record");

const OPERATION = "0010";

/* ══════════════════════════════════════════════════════════
   value helpers
   ══════════════════════════════════════════════════════════ */

const str = (v) => (v === undefined || v === null ? null : String(v));
const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

/**
 * Read a "_top" column with "_bottom" fallback from a qc_entry_temp row.
 * Used for every geometry/coating parameter that has a top/bottom pair.
 *
 * @param {object} qcRow
 * @param {string} topColumn     e.g. "clad_dia_top"
 * @returns {*} the top value, or the bottom value when top is blank, or null
 */
const topWithBottomFallback = (qcRow, topColumn) => {
    const bottomColumn = topColumn.replace(/_top$/, "_bottom");
    const topValue = qcRow[topColumn];
    if (!isBlank(topValue)) return topValue;
    return qcRow[bottomColumn] ?? null;
};

/**
 * Meanvalue is sent as a string; SAP sample shows "" for a value that was not
 * measured. Null/undefined/blank all become "".
 */
const meanValue = (v) => (isBlank(v) ? "" : String(v));

/* ══════════════════════════════════════════════════════════
   characteristic maps (SAP field -> qc_entry_temp column [+ top/bottom flag])
   ══════════════════════════════════════════════════════════ */

/**
 * Each entry: { sap: <SAP field name>, column: <qc_entry_temp column>,
 *               topBottom: true when column has a "_top"/"_bottom" pair,
 *               inspchar, code, codegroup }
 *
 * inspchar follows the confirmed sequence below (0010, 0020, 0030 ... in list
 * order, incrementing by 10 per parameter). code/codegroup are still
 * PLACEHOLDERS ("A" / "VISUAL") for every row since per-parameter values for
 * those have not been supplied yet — see the module doc comment above.
 */
const NATURAL_CHAR_MAP = [
    { sap: "OPTLEN", column: "optical_length", topBottom: false, inspchar: "0010" },
    { sap: "ATN1310", column: "avg_lsa_atn_1310", topBottom: false, inspchar: "0020" },
    { sap: "ATN1550", column: "avg_lsa_atn_1550", topBottom: false, inspchar: "0030" },
    { sap: "SPEC1285_1330", column: "spec_1285_1330", topBottom: false, inspchar: "0040" },
    { sap: "ATN1383", column: "avg_lsa_atn_1383", topBottom: false, inspchar: "0050" },
    { sap: "ATN1685", column: "avg_lsa_atn_1625", topBottom: false, inspchar: "0060" },
    { sap: "CUTOFF", column: "cut_off_top", topBottom: true, inspchar: "0070" },
    { sap: "MFD", column: "mfd_1310_top", topBottom: true, inspchar: "0080" },
    { sap: "CLAD_DIA", column: "clad_dia_top", topBottom: true, inspchar: "0090" },
    { sap: "CORE_DIA", column: "core_dia_top", topBottom: true, inspchar: "0100" },
    { sap: "CORE_CLAD_CONC", column: "core_clad_concentricity_top", topBottom: true, inspchar: "0110" },
    { sap: "CLAD_OVAL", column: "clad_ovality_top", topBottom: true, inspchar: "0120" },
    { sap: "PCOAT_DIA", column: "primary_coating_dia_top", topBottom: true, inspchar: "0130" },
    { sap: "SCOAT_DIA", column: "secondary_coating_dia_top", topBottom: true, inspchar: "0140" },
    { sap: "PCOAT_CONC", column: "primary_coating_concentricity_top", topBottom: true, inspchar: "0150" },
    { sap: "SCOAT_CONC", column: "secondary_coating_concentricity_top", topBottom: true, inspchar: "0160" },
    { sap: "COAT_OVAL", column: "coating_ovality_top", topBottom: true, inspchar: "0170" },
    { sap: "FCURL", column: "fiber_curl_top", topBottom: true, inspchar: "0180" },
    { sap: "ZD_WVLEN", column: "zero_disp_wave", topBottom: false, inspchar: "0190" },
    { sap: "SLOPE_ZD", column: "slope_zero_disp", topBottom: false, inspchar: "0200" },
    { sap: "DISP1550", column: "disp_1550", topBottom: false, inspchar: "0210" },
    { sap: "DISP1285_1330", column: "disp_1285_1330", topBottom: false, inspchar: "0220" },
    { sap: "DISP1625", column: "disp_1625", topBottom: false, inspchar: "0230" },
    { sap: "DISP1270_1340", column: "disp_1270_1340", topBottom: false, inspchar: "0240" },
    { sap: "PMD1310", column: "pmd_1310", topBottom: false, inspchar: "0250" },
    { sap: "PMD1550", column: "pmd_1550", topBottom: false, inspchar: "0260" },
    { sap: "CABLECUTOFF", column: "cable_cut_off", topBottom: false, inspchar: "0270" },
].map((entry) => ({
    ...entry,
    code: "A", // PLACEHOLDER
    codegroup: "VISUAL", // PLACEHOLDER
}));

/**
 * Colored-fiber characteristic map. Used when bobbin_entries.fiber_color is
 * non-null/non-blank and NOT "NATURAL" (see resolveCharMap()).
 *
 * Inspchar follows the same sequential convention as NATURAL_CHAR_MAP (0010,
 * 0020, 0030 ... incrementing by 10 in list order). code/codegroup are still
 * PLACEHOLDERS ("A" / "VISUAL") since per-parameter values have not been
 * supplied yet.
 */
const COLORED_CHAR_MAP = [
    { sap: "OPTLEN", column: "optical_length", topBottom: false, inspchar: "10" },
    { sap: "ATN1310", column: "avg_lsa_atn_1310", topBottom: false, inspchar: "20" },
    { sap: "ATN1550", column: "avg_lsa_atn_1550", topBottom: false, inspchar: "30" },
    { sap: "ATN1383", column: "avg_lsa_atn_1383", topBottom: false, inspchar: "40" },
    { sap: "ATN1625", column: "avg_lsa_atn_1625", topBottom: false, inspchar: "50" },
    //{ sap: "COLORDIA", column: "secondary_coating_dia_top", topBottom: true, inspchar: "60" },
].map((entry) => ({
    ...entry,
    code: "A", // PLACEHOLDER
    codegroup: "VISUAL", // PLACEHOLDER
}));

/**
 * Resolve which characteristic map to use for a bobbin, based on
 * bobbin_entries.fiber_color:
 *   - "NATURAL" (case-insensitive, trimmed)         -> NATURAL_CHAR_MAP
 *   - non-null / non-blank, anything else            -> COLORED_CHAR_MAP
 *   - null / blank / bobbin not found                -> null (caller should skip)
 *
 * @param {string} bobbinNo
 * @returns {Promise<{ fiberColor: string|null, charMap: object[] } | null>}
 */
const resolveCharMap = async (bobbinNo) => {
    const result = await pool.query(
        `SELECT fiber_color FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
        [bobbinNo]
    );

    if (result.rows.length === 0) return null;

    const fiberColor = result.rows[0].fiber_color;
    if (isBlank(fiberColor)) return null;

    const normalized = String(fiberColor).trim().toUpperCase();
    const charMap = normalized === "NATURAL" ? NATURAL_CHAR_MAP : COLORED_CHAR_MAP;

    return { fiberColor, charMap };
};

/* ══════════════════════════════════════════════════════════
   payload builder
   ══════════════════════════════════════════════════════════ */

/**
 * Build the Inspection Result Record payload for one bobbin/inspection lot.
 *
 * @param {string} inspectionLot
 * @param {object} qcRow      a qc_entry_temp row (SELECT * WHERE bobbin_no = ...)
 * @param {object[]} charMap  NATURAL_CHAR_MAP or COLORED_CHAR_MAP
 * @returns {object} the request payload
 */
const buildResultRecordPayload = (inspectionLot, qcRow, charMap) => {
    const lot = str(inspectionLot);

    const toItems = charMap.map(({ column, topBottom, inspchar, code, codegroup }) => {
        const rawValue = topBottom ? topWithBottomFallback(qcRow, column) : qcRow[column];

        return {
            InspectionLot: lot,
            Operation: OPERATION,
            Inspchar: inspchar,
            Code: code,
            Codegroup: codegroup,
            Meanvalue: meanValue(rawValue),
        };
    });

    return {
        InspectionLot: lot,
        Operation: OPERATION,
        Toitem: toItems,
    };
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
 * Post the Inspection Result Record for a bobbin/inspection lot.
 *
 * Resolves the bobbin's fiber type (bobbin_entries.fiber_color) to pick the
 * characteristic map, reads the values from qc_entry_temp (bobbin_no =
 * fg_batch), builds the Toitem array, and posts it to SAP.
 *
 * Never throws for "nothing to send" conditions — returns a
 * { posted:false, reason } result instead so callers can treat it as a skip:
 *   - bobbin not found in bobbin_entries, or fiber_color is null/blank
 *   - no row in qc_entry_temp for this bobbin
 *   - resolved characteristic map is empty
 *
 * @param {object} args
 * @param {string} args.bobbinNo        fg_batch / bobbin_no
 * @param {string} args.inspectionLot
 * @returns {Promise<object>} { posted, reason?, status?, message?, sap_response? }
 * @throws only on an actual HTTP/SAP failure (network error or Data.Status !== "S")
 */
export const postInspectionResultRecord = async ({ bobbinNo, inspectionLot }) => {
    if (!bobbinNo) {
        return { posted: false, reason: "no bobbin_no provided" };
    }
    if (!inspectionLot) {
        return { posted: false, reason: "no inspection_lot provided" };
    }

    const resolved = await resolveCharMap(bobbinNo);
    if (!resolved) {
        return { posted: false, reason: `bobbin "${bobbinNo}" not found or fiber_color not set` };
    }

    const { fiberColor, charMap } = resolved;
    if (charMap.length === 0) {
        return {
            posted: false,
            reason: `no characteristic map available for fiber_color "${fiberColor}" (bobbin "${bobbinNo}")`,
        };
    }

    const qcResult = await pool.query(
        `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [bobbinNo]
    );
    if (qcResult.rows.length === 0) {
        return { posted: false, reason: `no qc_entry_temp row found for bobbin "${bobbinNo}"` };
    }

    const qcRow = qcResult.rows[0];
    const payload = buildResultRecordPayload(inspectionLot, qcRow, charMap);
    const url = RESULT_RECORD_URL();
    const endpoint = process.env.SAP_INSPECTION_RESULT_RECORD_ENDPOINT || "Inspection-Result-Record";

    console.log("[SAP-POST][RESULT-RECORD] URL:", url);
    console.log("[SAP-POST][RESULT-RECORD] Payload:", JSON.stringify(payload));

    const startedAt = Date.now();
    let response;
    try {
        response = await postWithAuth(url, payload);
    } catch (httpError) {
        await logSapCall({
            operation: "INSPECTION_RESULT_RECORD",
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

    const durationMs = Date.now() - startedAt;
    const data = response?.Data || {};
    const status = String(data.Status || "").toUpperCase();
    const message = data.Message || response?.Message || "";

    if (status !== "S") {
        await logSapCall({
            operation: "INSPECTION_RESULT_RECORD",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: Number(response?.StatusCode) || null,
            sap_status: status || "E",
            message: message || "no success status returned",
            reference_type: "INSPECTION_LOT",
            reference_id: str(inspectionLot),
            inspection_lot: str(inspectionLot),
            batch: str(bobbinNo),
            request_payload: payload,
            response_payload: response,
            duration_ms: durationMs,
        });

        const err = new Error(
            `Inspection Result Record not successful for lot ${inspectionLot}/bobbin ${bobbinNo}: ` +
                `status="${status}" ${message || "no success status returned"}`
        );
        err.inspection_lot = inspectionLot;
        err.bobbin_no = bobbinNo;
        err.sap_response = response;
        throw err;
    }

    await logSapCall({
        operation: "INSPECTION_RESULT_RECORD",
        status: "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: url,
        http_status_code: Number(response?.StatusCode) || null,
        sap_status: status,
        message,
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
        status,
        message,
        sap_response: response,
    };
};

export default postInspectionResultRecord;
