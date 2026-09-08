import pool from "../../../db/postgres.js";
import { postInspectionLotUd } from "./inspection_lot_ud.service.js";
import { resolveUdCode } from "./ud_code.js";

/**
 * Inspection Lot Usage Decision (UD) — Batch / Scheduler Service
 *
 * Automatically posts Usage Decisions for finished-goods bobbins that are
 * pending a decision, driven entirely off the database:
 *
 *   1. Read every order_conf row that still needs a UD:
 *        ud_required = true
 *        AND ud = false
 *        AND inspection_lot IS NOT NULL AND inspection_lot <> 0
 *
 *   2. For each row, find its bobbin in bobbin_entries. order_conf.fg_batch
 *      holds the FG bobbin_no (see pt_entry / rewinding services where
 *      fg_batch = bobbin_no), so the join key is:
 *        bobbin_entries.bobbin_no = order_conf.fg_batch
 *
 *   3. Only rows whose bobbin has a non-empty final_grade are actioned.
 *      The final_grade decides the UD code:
 *        final_grade = 'REW'  -> UD_CODE "A2"
 *        final_grade = 'FAIL' -> UD_CODE "R3"
 *        anything else        -> UD_CODE "A1"
 *
 *   4. Each decision is posted through postInspectionLotUd with type "FTUD",
 *      which — on SAP success — flips order_conf.ud = true so the row is not
 *      picked up again.
 *
 * Designed to be called from a scheduler. Each lot is posted independently:
 * one failure never blocks the rest.
 *
 * The grade -> UD code mapping lives in the shared ./ud_code.js module
 * (resolveUdCode). It is re-exported here for backward compatibility so
 * existing importers of this file keep working.
 *
 * Exposes:
 *   - resolveUdCode(finalGrade)             grade -> UD code mapping (re-export)
 *   - fetchPendingUdCandidates()            rows ready for a UD
 *   - postPendingInspectionLotUds()         the batch runner (scheduler entry)
 */

/* ── grade -> UD code mapping (centralized) ────────────────── */

// Re-export so callers that import resolveUdCode from this module keep working.
export { resolveUdCode };

/* ── candidate fetching ────────────────────────────────────── */

/**
 * Fetch every order_conf row that needs a UD and whose bobbin carries a
 * usable final_grade.
 *
 * @returns {Promise<Array<{
 *   order_conf_id: number,
 *   inspection_lot: string,
 *   fg_batch: string,
 *   final_grade: string
 * }>>}
 */
export const fetchPendingUdCandidates = async () => {
    const result = await pool.query(
        `SELECT
             oc.order_conf_id            AS order_conf_id,
             oc.inspection_lot::text     AS inspection_lot,
             oc.fg_batch                 AS fg_batch,
             be.final_grade              AS final_grade
         FROM order_conf oc
         JOIN bobbin_entries be
              ON be.bobbin_no = oc.fg_batch
        WHERE oc.ud_required = true
          AND COALESCE(oc.ud, false) = false
          AND oc.inspection_lot IS NOT NULL
          AND oc.inspection_lot <> 0
          AND be.final_grade IS NOT NULL
          AND btrim(be.final_grade) <> ''
        ORDER BY oc.order_conf_id ASC`
    );
    return result.rows;
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API — scheduler entry point
   ══════════════════════════════════════════════════════════ */

/**
 * Post Usage Decisions for all pending finished-goods bobbins.
 *
 * Reads candidates from the DB, derives the UD code from each bobbin's
 * final_grade, and posts each decision to SAP. Rows are handled independently;
 * a single failure is recorded and the run continues.
 *
 * On SAP success the underlying UD service flips order_conf.ud = true (via the
 * "FTUD" type), so posted rows drop out of the next run automatically.
 *
 * @returns {Promise<{
 *   total: number,
 *   posted: number,
 *   failed: number,
 *   results: object[],
 *   errors: object[]
 * }>}
 */
export const postPendingInspectionLotUds = async () => {
    const candidates = await fetchPendingUdCandidates();

    const summary = {
        total: candidates.length,
        posted: 0,
        failed: 0,
        results: [],
        errors: [],
    };

    if (candidates.length === 0) return summary;

    for (const row of candidates) {
        const udCode = resolveUdCode(row.final_grade);
        const entry = {
            InspectionLot: row.inspection_lot,
            UD_CODE: udCode,
            bobbin_no: row.fg_batch,
            type: "FTUD",
        };

        try {
            const result = await postInspectionLotUd(entry);
            summary.posted += 1;
            summary.results.push({
                order_conf_id: row.order_conf_id,
                fg_batch: row.fg_batch,
                final_grade: row.final_grade,
                ...result,
            });
        } catch (error) {
            summary.failed += 1;
            summary.errors.push({
                order_conf_id: row.order_conf_id,
                fg_batch: row.fg_batch,
                final_grade: row.final_grade,
                inspection_lot: row.inspection_lot,
                ud_code: udCode,
                message: error.message,
                http_status: error.response?.status,
                sap_response: error.sap_response ?? error.response?.data,
            });
            console.error(
                `[SAP-POST][UD-BATCH] Failed lot ${row.inspection_lot} (${udCode}):`,
                error.message
            );
        }
    }

    return summary;
};

export default postPendingInspectionLotUds;
