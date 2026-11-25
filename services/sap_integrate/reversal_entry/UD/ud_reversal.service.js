import axios from "axios";
import pool from "../../../../db/postgres.js";
import { sapAuthHeader, clearSapToken } from "../../auth/sap_auth.service.js";
import { logSapCall } from "../../sap_log.service.js";

/**
 * UD (usage decision) reversal.
 *
 * Input: bobbin_no and ud_type (UD1 / UD2 / UD3 ...).
 *
 * Checks (any failure stops the reversal, nothing is changed):
 *   1. a transactions row exists with "type" = 'UD', fg_batch = bobbin_no and
 *      ud_type = <requested>  (the latest one is used; it gives inspection_lot)
 *   2. that row's reverse_status is not already true ("already reversed")
 *   3. every LATER UD of the same bobbin (UD2, UD3 ... when UD1 is requested)
 *      that exists must already have reverse_status = true; if one has
 *      reverse_status = false the request is rejected: reverse that UD first
 *   4. no UD row of the bobbin is being posted by the scheduler right now
 *
 * Then, in ONE transaction:
 *   - status = false (UD never posted to SAP): no SAP call, only mark reversed
 *   - status = true : POST SAP_BASE_URL + "ud-reversal" with
 *       { "PRUEFLOS": "<inspection_lot, 12 digits>", "BUDAT": "<today YYYYMMDD>",
 *         "STATUS": "", "MESSAGE": "" }
 *     (one re-login and retry on a 401). If SAP fails nothing is changed.
 *   - reverse_status = true on the requested UD row(s)
 *
 * order_conf.ud is NOT reset: the UD batch scheduler picks rows with ud = false
 * and would post a new UD for a bobbin that is being reversed.
 *
 * The endpoint name can be overridden with SAP_UD_REVERSAL_ENDPOINT.
 */

const validationError = (message) => {
    const err = new Error(message);
    err.code = "VALIDATION";
    return err;
};

export const normalizeBobbinNo = (v) => {
    const bobbinNo = v === undefined || v === null ? "" : String(v).trim();
    if (!bobbinNo) throw validationError("bobbin_no is required");
    return bobbinNo;
};

export const normalizeUdType = (v) => {
    const udType = v === undefined || v === null ? "" : String(v).trim().toUpperCase();
    if (!udType) throw validationError("ud_type is required");
    if (!/^UD\d+$/.test(udType)) {
        throw validationError("ud_type must be like UD1, UD2, UD3");
    }
    return udType;
};

// "UD3" -> 3
const udNumber = (udType) => Number(String(udType).replace(/\D/g, ""));

const UD_REVERSAL_ENDPOINT = () => process.env.SAP_UD_REVERSAL_ENDPOINT || "ud-reversal";
const SAP_TIMEOUT_MS = Number(process.env.SAP_REQUEST_TIMEOUT_MS) || 30000;

const buildSapUrl = (endpoint) => {
    const base = (process.env.SAP_BASE_URL || "").replace(/\/+$/, "");
    return `${base}/${String(endpoint).replace(/^\/+/, "")}`;
};

const postWithAuth = async (url, payload) => {
    const send = async (forceRefresh) =>
        axios({
            method: "POST",
            url,
            data: payload,
            timeout: SAP_TIMEOUT_MS,
            headers: {
                "Content-Type": "application/json",
                ...(await sapAuthHeader(forceRefresh)),
            },
        });

    try {
        const response = await send(false);
        return { data: response.data ?? {}, httpStatus: response.status };
    } catch (error) {
        if (error.response?.status === 401) {
            clearSapToken();
            const response = await send(true);
            return { data: response.data ?? {}, httpStatus: response.status };
        }
        throw error;
    }
};

// SAP expects zero-padded strings: lot 40000002247 -> "040000002247".
const padNum = (v, len) => String(v).replace(/\D/g, "").padStart(len, "0");

// SAP date format: YYYYMMDD (current date).
const sapToday = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};

/**
 * Reverse one UD of a bobbin.
 * @param {string} rawBobbinNo
 * @param {string} rawUdType   UD1 / UD2 / UD3 ...
 * @param {string} reversedBy  emp_id from the MES JWT
 */
export const reverseUdEntry = async (rawBobbinNo, rawUdType, reversedBy) => {
    const bobbinNo = normalizeBobbinNo(rawBobbinNo);
    const udType = normalizeUdType(rawUdType);
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // All UD rows of the bobbin, locked until COMMIT / ROLLBACK so the
        // scheduler cannot post them while the reversal runs (and vice versa).
        let udRows;
        try {
            const res = await client.query(
                `SELECT transaction_id, ud_type, inspection_lot, status, reverse_status
                   FROM transactions
                  WHERE "type" = 'UD'
                    AND fg_batch = $1
                  ORDER BY transaction_id ASC
                    FOR UPDATE NOWAIT`,
                [bobbinNo]
            );
            udRows = res.rows;
        } catch (lockError) {
            if (lockError.code === "55P03") {
                throw validationError(
                    "This bobbin's UD is being posted to SAP right now. Try again in a minute."
                );
            }
            throw lockError;
        }

        // 1) requested UD must exist (latest row of that ud_type)
        const sameType = udRows.filter(
            (r) => String(r.ud_type || "").trim().toUpperCase() === udType
        );
        if (sameType.length === 0) {
            throw validationError(`There is no ${udType} transaction against this bobbin_no.`);
        }
        const target = sameType[sameType.length - 1];

        // 2) must not be reversed already
        if (target.reverse_status === true) {
            throw validationError(`${udType} is already reversed for this bobbin_no.`);
        }

        // 3) later UDs (UD2, UD3 ... for UD1) must already be reversed
        const requestedNo = udNumber(udType);
        const laterNotReversed = udRows.filter((r) => {
            const t = String(r.ud_type || "").trim().toUpperCase();
            return /^UD\d+$/.test(t) && udNumber(t) > requestedNo && r.reverse_status !== true;
        });
        if (laterNotReversed.length > 0) {
            const names = [
                ...new Set(laterNotReversed.map((r) => String(r.ud_type).trim().toUpperCase())),
            ].join(", ");
            throw validationError(
                `${udType} cannot be reversed yet. Reverse ${names} first.`
            );
        }

        // Rows to flag: the requested ud_type rows of the same inspection lot that are not reversed.
        const flagIds = sameType
            .filter(
                (r) =>
                    r.reverse_status !== true &&
                    String(r.inspection_lot ?? "") === String(target.inspection_lot ?? "")
            )
            .map((r) => r.transaction_id);

        // 4) SAP reversal (only when the UD was really posted)
        let sap;
        if (target.status !== true) {
            sap = {
                success: true,
                skipped: true,
                message: `${udType} was not posted to SAP (status = false). SAP reversal skipped.`,
            };
        } else {
            sap = await reverseUdInSAP(bobbinNo, udType, target.inspection_lot);
        }

        await client.query(
            `UPDATE transactions
                SET reverse_status = true,
                    status = false,
                    updated_at = CURRENT_TIMESTAMP
              WHERE transaction_id = ANY($1::int[])`,
            [flagIds]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: `${udType} reversed successfully`,
            bobbin_no: bobbinNo,
            ud_type: udType,
            inspection_lot: target.inspection_lot,
            reversed_by: reversedBy ?? null,
            sap,
        };
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }
};

/**
 * SAP side: POST ud-reversal for an inspection lot.
 * Separate from reverseUdEntry (MES); it can be called on its own.
 *
 * @param {string} bobbinNo
 * @param {string} udType
 * @param {string|number} inspectionLot
 */
export const reverseUdInSAP = async (bobbinNo, udType, inspectionLot) => {
    const lot = inspectionLot === undefined || inspectionLot === null ? "" : String(inspectionLot).trim();
    if (!lot || Number(lot) === 0) {
        throw validationError(`${udType} has no inspection lot. We cannot process the UD reversal.`);
    }

    const payload = {
        PRUEFLOS: padNum(lot, 12),
        BUDAT: sapToday(),
        STATUS: "",
        MESSAGE: "",
    };

    const endpoint = UD_REVERSAL_ENDPOINT();
    const url = buildSapUrl(endpoint);
    const startedAt = Date.now();
    console.log("[UD Reversal SAP] POST URL:", url, payload);

    let result;
    try {
        result = await postWithAuth(url, payload);
    } catch (httpError) {
        const upstream = httpError.response?.data;
        const msg = upstream?.Message || upstream?.message || upstream?.MESSAGE || httpError.message;
        await logSapCall({
            operation: "UD_REVERSAL",
            status: "FAILED",
            sap_endpoint: endpoint,
            sap_url: url,
            http_status_code: httpError.response?.status,
            message: msg,
            reference_type: "BOBBIN",
            reference_id: bobbinNo,
            inspection_lot: lot,
            request_payload: payload,
            response_payload: upstream,
            error_detail: httpError.stack,
            duration_ms: Date.now() - startedAt,
        });
        const err = new Error(`SAP UD reversal failed: ${msg}`);
        err.code = "SAP_ERROR";
        err.sap_response = upstream;
        throw err;
    }

    const sapResponse = result.data;
    // STATUS "E" means SAP rejected the reversal.
    const sapStatus = String(sapResponse?.STATUS ?? sapResponse?.Data?.Status ?? "").toUpperCase();
    const sapMessage = sapResponse?.MESSAGE || sapResponse?.Message || sapResponse?.message;
    const failed = sapStatus === "E";

    await logSapCall({
        operation: "UD_REVERSAL",
        status: failed ? "FAILED" : "SUCCESS",
        sap_endpoint: endpoint,
        sap_url: url,
        http_status_code: result.httpStatus,
        message: sapMessage,
        reference_type: "BOBBIN",
        reference_id: bobbinNo,
        inspection_lot: lot,
        request_payload: payload,
        response_payload: sapResponse,
        duration_ms: Date.now() - startedAt,
    });

    if (failed) {
        const err = new Error(`SAP UD reversal failed: ${sapMessage || "unknown error"}`);
        err.code = "SAP_ERROR";
        err.sap_response = sapResponse;
        throw err;
    }

    return {
        success: true,
        skipped: false,
        message: sapMessage || "SAP UD reversed",
        payload,
        sap_response: sapResponse,
    };
};

export default reverseUdEntry;
