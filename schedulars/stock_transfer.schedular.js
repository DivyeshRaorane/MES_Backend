import cron from "node-cron";
import { postPendingStockTransfers } from "../services/sap_integrate/sap_transaction/stock_transfer_location_to_location.service.js";

/**
 * Stock Transfer (location-to-location) Scheduler.
 *
 * Periodically posts pending stock_transfer rows (transfer = false) to SAP as
 * storage-location-to-storage-location (311) stock transfers:
 *   Material                     <- material_code
 *   Plant / StorageLocation      <- plant / storage_location
 *   Batch                        <- batch
 *   IssuingOrReceivingPlant      <- receiving_plant
 *   IssuingOrReceivingStorageLoc <- receiving_storage_location
 *   QuantityInEntryUnit / EntryUnit <- qty / uom
 *
 * On SAP success the posted rows are flagged transfer = true, so they drop out
 * of the next run.
 *
 * Cron schedule is configurable via SAP_STOCK_TRANSFER_SCHEDULE (default: every 1 min).
 */
export const startStockTransferSchedular = () => {
    const schedule = process.env.SAP_STOCK_TRANSFER_SCHEDULE || "*/1 * * * *";

    cron.schedule(schedule, async () => {
        try {
            console.log("[Stock Transfer Scheduler] Running...");
            const summary = await postPendingStockTransfers();
            console.log(
                `[Stock Transfer Scheduler] Done. total=${summary.total} posted=${summary.posted} failed=${summary.failed}`
            );
        } catch (error) {
            console.error("[Stock Transfer Scheduler] Error:", error.message);
        }
    });

    console.log(`[Stock Transfer Scheduler] Started (cron "${schedule}")`);
};
