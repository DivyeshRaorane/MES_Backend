import cron from "node-cron";
import { syncProcessOrders } from "../services/sap_integrate/process_order/process_order.service.js";

/**
 * Process Order Scheduler - runs on the 1st of every month at 5:00 PM.
 * Fetches today's process orders from SAP and syncs them into
 * order_hdr / order_comp / order_opr: new orders are inserted and orders
 * already present are updated in place.
 */
export const startProcessOrderSchedular = () => {
    // "0 17 1 * *" = minute 0, hour 17 (5 PM), day-of-month 1, every month
    cron.schedule("0 17 1 * *", async () => {
        try {
            console.log("[Process Order Scheduler] Running...");
            const summary = await syncProcessOrders();
            console.log(
                `[Process Order Scheduler] Done. fetched=${summary.fetched} inserted=${summary.inserted} updated=${summary.updated} failed=${summary.failed}`
            );
        } catch (error) {
            console.error("[Process Order Scheduler] Error:", error.message);
        }
    });

    console.log("[Process Order Scheduler] Started (runs on the 1st of every month at 5 PM)");
};
