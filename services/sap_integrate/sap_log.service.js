import { randomUUID } from "node:crypto";
import pool from "../../db/postgres.js";

/**
 * SAP Transaction Log Service
 *
 * Central helper used by every SAP-calling service in services/sap_integrate to
 * record one row per SAP HTTP call (success or failure) in `sap_transaction_log`.
 *
 * Design goals:
 *   - Logging must NEVER break the SAP flow. Every insert is wrapped so a
 *     logging failure only warns to the console and returns null.
 *   - One row per SAP call. Bulk runs share a `correlation_id` (see
 *     newCorrelationId) so all calls in one run can be grouped later.
 *
 * Usage:
 *   import { logSapCall, newCorrelationId } from "../sap_log.service.js";
 *
 *   await logSapCall({
 *     operation: "STOCK_TRANSFER_MTM",
 *     status: "SUCCESS",              // or "FAILED"
 *     sap_url: url,
 *     movement_type: "309",
 *     http_status_code: 201,
 *     message: "created",
 *     material_document: "4900003226",
 *     request_payload: payload,
 *     response_payload: response,
 *   });
 */

/** Generate a correlation id to tie all log rows from one bulk run together. */
export const newCorrelationId = () => randomUUID();

/* ── value helpers ─────────────────────────────────────────── */

// Coerce to a trimmed string or null (used for the scalar reference columns).
const str = (v) => (v === undefined || v === null ? null : String(v));

// Coerce to an integer or null (http_status_code, duration_ms).
const intOrNull = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
    return Number.isNaN(n) ? null : n;
};

// Serialize an object/value for a jsonb column. Returns null on failure so a
// circular / non-serializable payload can never crash the logger.
const toJson = (v) => {
    if (v === undefined || v === null) return null;
    try {
        return JSON.stringify(v);
    } catch (_) {
        return null;
    }
};

// Normalize source_ids into an int[] (or null).
const toIntArray = (v) => {
    if (v === undefined || v === null) return null;
    const arr = Array.isArray(v) ? v : [v];
    const ints = arr.map((x) => intOrNull(x)).filter((x) => x !== null);
    return ints.length ? ints : null;
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Insert a single SAP call log row. Never throws.
 *
 * @param {object} entry
 * @param {string}  entry.operation          required, e.g. "FG_CONFIRMATION"
 * @param {string}  entry.status             required, "SUCCESS" | "FAILED"
 * @param {string} [entry.sap_endpoint]
 * @param {string} [entry.sap_url]
 * @param {string} [entry.http_method]       defaults "POST"
 * @param {string} [entry.movement_type]
 * @param {number} [entry.http_status_code]
 * @param {string} [entry.sap_status]        business status "S" | "E"
 * @param {string} [entry.message]
 * @param {string} [entry.reference_type]
 * @param {string} [entry.reference_id]
 * @param {string} [entry.material_document]
 * @param {string} [entry.material_code]
 * @param {string} [entry.batch]
 * @param {string} [entry.inspection_lot]
 * @param {string} [entry.prod_order]
 * @param {string} [entry.correlation_id]
 * @param {string} [entry.source_table]
 * @param {Array}  [entry.source_ids]
 * @param {object} [entry.request_payload]
 * @param {object} [entry.response_payload]
 * @param {string} [entry.error_detail]
 * @param {string} [entry.triggered_by]
 * @param {number} [entry.duration_ms]
 * @param {object} [client]                  optional pg client (defaults to pool)
 * @returns {Promise<number|null>} the new log_id, or null when logging failed
 */
export const logSapCall = async (entry = {}, client = pool) => {
    try {
        if (!entry.operation || !entry.status) {
            console.warn("[SAP-LOG] skipped: operation and status are required");
            return null;
        }

        const result = await client.query(
            `INSERT INTO sap_transaction_log (
                operation, sap_endpoint, sap_url, http_method, movement_type,
                status, http_status_code, sap_status, message,
                reference_type, reference_id, material_document, material_code,
                batch, inspection_lot, prod_order,
                correlation_id, source_table, source_ids,
                request_payload, response_payload, error_detail,
                triggered_by, duration_ms
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                $10, $11, $12, $13,
                $14, $15, $16,
                $17, $18, $19,
                $20::jsonb, $21::jsonb, $22,
                $23, $24
            ) RETURNING log_id`,
            [
                str(entry.operation),
                str(entry.sap_endpoint),
                str(entry.sap_url),
                str(entry.http_method) || "POST",
                str(entry.movement_type),
                str(entry.status),
                intOrNull(entry.http_status_code),
                str(entry.sap_status),
                str(entry.message),
                str(entry.reference_type),
                str(entry.reference_id),
                str(entry.material_document),
                str(entry.material_code),
                str(entry.batch),
                str(entry.inspection_lot),
                str(entry.prod_order),
                str(entry.correlation_id),
                str(entry.source_table),
                toIntArray(entry.source_ids),
                toJson(entry.request_payload),
                toJson(entry.response_payload),
                str(entry.error_detail),
                str(entry.triggered_by),
                intOrNull(entry.duration_ms),
            ]
        );

        return result.rows[0]?.log_id ?? null;
    } catch (error) {
        // Logging must never break the SAP flow — warn and move on.
        console.error("[SAP-LOG] failed to write log row:", error.message);
        return null;
    }
};

export default logSapCall;
