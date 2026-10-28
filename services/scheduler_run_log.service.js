import pool from "../db/postgres.js";

/**
 * Scheduler Run Log Service
 * ═════════════════════════
 *
 * Records one row per scheduler run in `scheduler_run_log` (see
 * Schemas/postgresql/scheduler_run_log.sql). This gives a persistent history of
 * every run — when it started/ended, its outcome, and the full summary object
 * the scheduler would otherwise only print to the console.
 *
 * Design goal (same as sap_log.service.js): logging must NEVER break the
 * scheduler. Every DB write is wrapped so a logging failure only warns to the
 * console and returns null.
 *
 * Typical use from a scheduler tick:
 *
 *   const runId = await startSchedulerRun("transaction_post");
 *   try {
 *       const summary = await doWork();
 *       await finishSchedulerRun(runId, { status: "COMPLETED", message: summary });
 *   } catch (error) {
 *       await finishSchedulerRun(runId, { status: "FAILED", error: error.message });
 *   }
 *
 * A tick that is skipped (previous run still in progress) can be recorded with
 * logSkippedRun("transaction_post").
 */

/* ── value helpers ─────────────────────────────────────────── */

// Serialize a value for a jsonb column. Returns null on failure so a
// circular / non-serializable payload can never crash the logger.
const toJson = (v) => {
    if (v === undefined || v === null) return null;
    try {
        return JSON.stringify(v);
    } catch (_) {
        return null;
    }
};

/* ══════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════ */

/**
 * Insert a "run started" row and return its id. Never throws.
 *
 * @param {string} schedulerName  e.g. "transaction_post"
 * @returns {Promise<number|null>} the new run id, or null when logging failed
 */
export const startSchedulerRun = async (schedulerName) => {
    try {
        const result = await pool.query(
            `INSERT INTO scheduler_run_log (scheduler_name, status, start_time)
             VALUES ($1, 'RUNNING', CURRENT_TIMESTAMP)
             RETURNING id`,
            [String(schedulerName)]
        );
        return result.rows[0]?.id ?? null;
    } catch (error) {
        console.error("[SCHED-LOG] failed to write run-start row:", error.message);
        return null;
    }
};

/**
 * Update a run row with its outcome. Never throws.
 *
 * @param {number|null} runId          id returned by startSchedulerRun (no-op if null)
 * @param {object} outcome
 * @param {string} [outcome.status]    'COMPLETED' | 'FAILED'  (default 'COMPLETED')
 * @param {object} [outcome.message]   the summary object (stored as jsonb)
 * @param {string} [outcome.error]     top-level error text when the run threw
 * @returns {Promise<void>}
 */
export const finishSchedulerRun = async (runId, { status = "COMPLETED", message, error } = {}) => {
    if (runId === null || runId === undefined) return;
    try {
        await pool.query(
            `UPDATE scheduler_run_log
                SET status      = $2,
                    end_time    = CURRENT_TIMESTAMP,
                    duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000,
                    message     = $3::jsonb,
                    error       = $4
              WHERE id = $1`,
            [runId, String(status), toJson(message), error ? String(error) : null]
        );
    } catch (dbError) {
        console.error("[SCHED-LOG] failed to write run-finish row:", dbError.message);
    }
};

/**
 * Record a run that was skipped because a previous run was still in progress.
 * Never throws.
 *
 * @param {string} schedulerName
 * @param {string} [reason]
 * @returns {Promise<void>}
 */
export const logSkippedRun = async (schedulerName, reason = "previous run still in progress") => {
    try {
        await pool.query(
            `INSERT INTO scheduler_run_log (scheduler_name, status, start_time, end_time, message)
             VALUES ($1, 'SKIPPED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $2::jsonb)`,
            [String(schedulerName), toJson({ reason })]
        );
    } catch (error) {
        console.error("[SCHED-LOG] failed to write run-skip row:", error.message);
    }
};

export default { startSchedulerRun, finishSchedulerRun, logSkippedRun };
