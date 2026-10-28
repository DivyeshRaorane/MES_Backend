import cron from "node-cron";
import { postPendingTransactions } from "../services/sap_integrate/sap_transaction/transaction_post.service.js";
import {
    startSchedulerRun,
    finishSchedulerRun,
    logSkippedRun,
} from "../services/scheduler_run_log.service.js";

/**
 * Unified SAP Transaction Posting Scheduler.
 *
 * Periodically posts pending rows from the `transactions` table (status = false)
 * to SAP. A single dispatcher routes each row by its `type`:
 *   FG    -> prdorderconfirmation
 *   SCRAP -> goods-issue-cost-center
 *   MTM   -> stock-transfer-material-to-material            (movement 309)
 *   LTL   -> stock-transfer-from-storageloc-to-storagelocation (movement 311)
 *   UD    -> inspection-lot
 *
 * Rows are posted in strict FIFO order (oldest transaction_id first), one SAP
 * call per row. Successfully posted rows are flagged status = true and drop out
 * of the next run; failed rows stay pending and are retried.
 *
 * Overlap guard: cron fires on the wall clock (every 15 min by default), but a
 * tick is SKIPPED when the previous run is still in progress — tracked by the
 * in-memory `isRunning` flag below. This prevents two runs overlapping within
 * this process (so a slow run never double-posts via the stale-claim path). The
 * flag is per Node process; run a single instance, or add a DB advisory lock if
 * you run multiple instances.
 *
 * Run history: every run (and every skipped tick) is recorded in
 * `scheduler_run_log` via scheduler_run_log.service.js — start/end time,
 * outcome, and the full summary as JSON. Logging never breaks the run.
 *
 * Cron schedule is configurable via SAP_TRANSACTION_SCHEDULE (default: every 15 min).
 */
const SCHEDULER_NAME = "transaction_post";

export const startTransactionPostSchedular = () => {
    const schedule = process.env.SAP_TRANSACTION_SCHEDULE || "*/15 * * * *";

    // In-memory overlap guard: true while a run is in progress.
    let isRunning = false;

    cron.schedule(schedule, async () => {
        // Skip this tick if the previous run hasn't finished yet.
        if (isRunning) {
            console.log(
                "[Transaction Post Scheduler] Previous run still in progress, skipping this tick."
            );
            await logSkippedRun(SCHEDULER_NAME);
            return;
        }

        isRunning = true;
        const runId = await startSchedulerRun(SCHEDULER_NAME);

        try {
            console.log("[Transaction Post Scheduler] Running...");
            const summary = await postPendingTransactions();
            console.log(
                `[Transaction Post Scheduler] Done. pending=${summary.total_pending} ` +
                    `posted=${summary.posted} ` +
                    `fg=${summary.by_type.FG} scrap=${summary.by_type.SCRAP} ` +
                    `mtm=${summary.by_type.MTM} ltl=${summary.by_type.LTL} ud=${summary.by_type.UD} ` +
                    `skipped=${summary.skipped} failed=${summary.failed}`
            );
            await finishSchedulerRun(runId, { status: "COMPLETED", message: summary });
        } catch (error) {
            console.error("[Transaction Post Scheduler] Error:", error.message);
            await finishSchedulerRun(runId, { status: "FAILED", error: error.message });
        } finally {
            // Always clears, even on error, so the next tick can run.
            isRunning = false;
        }
    });

    console.log(`[Transaction Post Scheduler] Started (cron "${schedule}")`);
};
