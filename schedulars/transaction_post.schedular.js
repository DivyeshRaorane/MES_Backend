import cron from "node-cron";
import { postPendingTransactions } from "../services/sap_integrate/sap_transaction/transaction_post.service.js";

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
 * Cron schedule is configurable via SAP_TRANSACTION_SCHEDULE (default: every 1 min).
 */
export const startTransactionPostSchedular = () => {
    const schedule = process.env.SAP_TRANSACTION_SCHEDULE || "*/1 * * * *";

    cron.schedule(schedule, async () => {
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
        } catch (error) {
            console.error("[Transaction Post Scheduler] Error:", error.message);
        }
    });

    console.log(`[Transaction Post Scheduler] Started (cron "${schedule}")`);
};
