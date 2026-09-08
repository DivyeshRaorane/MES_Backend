import cron from "node-cron";
import { syncMaterialStock } from "../services/sap_integrate/preform_data/material_stock.service.js";

/**
 * Material Stock Scheduler - runs every 1 minute (temporary, for testing).
 * Fetches stock from SAP for the configured Materials and inserts any
 * new batches into preform_data.
 */
export const startMaterialStockSchedular = () => {
    cron.schedule("* * * * *", async () => {
        try {
            console.log("[Material Stock Scheduler] Running...");
            const summary = await syncMaterialStock();
            console.log(
                `[Material Stock Scheduler] Done. fetched=${summary.fetched} inserted=${summary.inserted} skipped_existing=${summary.skipped_existing} skipped_no_master=${summary.skipped_no_master}`
            );
        } catch (error) {
            console.error("[Material Stock Scheduler] Error:", error.message);
        }
    });

    console.log("[Material Stock Scheduler] Started (runs every 1 min)");
};
