import cron from "node-cron";
import { postPendingMaterialMoves } from "../services/sap_integrate/sap_transaction/stock_transfer_material_to_material.service.js";

/**
 * Material Move (product-type upgrade) Scheduler.
 *
 * Periodically posts pending material_move rows (movement = false) to SAP as
 * material-to-material (309) stock transfers:
 *   Material           <- existing_product_type
 *   IssgOrRcvgMaterial <- new_product_type
 *   Batch              <- bobbin_no
 *
 * On SAP success the posted rows are flagged movement = true, so they drop out
 * of the next run.
 *
 * Cron schedule is configurable via SAP_MATERIAL_MOVE_SCHEDULE (default: every 1 min).
 */
export const startMaterialMoveSchedular = () => {
    const schedule = process.env.SAP_MATERIAL_MOVE_SCHEDULE || "*/1 * * * *";

    cron.schedule(schedule, async () => {
        try {
            console.log("[Material Move Scheduler] Running...");
            const summary = await postPendingMaterialMoves();
            console.log(
                `[Material Move Scheduler] Done. total=${summary.total} posted=${summary.posted} failed=${summary.failed}`
            );
        } catch (error) {
            console.error("[Material Move Scheduler] Error:", error.message);
        }
    });

    console.log(`[Material Move Scheduler] Started (cron "${schedule}")`);
};
