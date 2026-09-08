import cron from "node-cron";
import { postPendingSapTransactions } from "../services/sap_integrate/sap_transaction/sap_transaction_post.service.js";

/**
 * SAP Transaction Posting Scheduler — runs every 30 minutes.
 * Posts all pending sap_transaction rows (status = false) to SAP:
 *   FG    -> prdorderconfirmation
 *   SCRAP -> goods-issue-cost-center
 * Successfully posted rows are marked status = true.
 */
export const startSapTransactionPostSchedular = () => {
    // "*/30 * * * *" = every 30 minutes
    cron.schedule("*/1 * * * *", async () => {
        try {
            console.log("[SAP Transaction Post Scheduler] Running...");
            const summary = await postPendingSapTransactions();
            console.log(
                `[SAP Transaction Post Scheduler] Done. pending=${summary.total_pending} fg_rows=${summary.fg_rows_posted} scrap_rows=${summary.scrap_rows_posted} failed=${summary.failed}`
            );
        } catch (error) {
            console.error("[SAP Transaction Post Scheduler] Error:", error.message);
        }
    });

    console.log("[SAP Transaction Post Scheduler] Started (every 30 min)");
};
