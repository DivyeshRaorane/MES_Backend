import cron from "node-cron";
import { postPendingInspectionLotUds } from "../services/sap_integrate/inspection_lot/inspection_lot_ud_batch.service.js";

/**
 * Inspection Lot Usage Decision (UD) Scheduler.
 *
 * Periodically posts Usage Decisions for finished-goods bobbins that are
 * pending a decision:
 *   order_conf.ud_required = true AND ud = false  (with a real inspection_lot)
 *   joined to bobbin_entries on fg_batch = bobbin_no
 *
 * The UD code is derived from bobbin_entries.final_grade:
 *   REW -> A2, FAIL -> R3, anything else -> A1.
 *
 * On SAP success order_conf.ud is flipped to true, so posted rows drop out of
 * the next run.
 *
 * Cron schedule is configurable via SAP_UD_SCHEDULE (default: every 30 min).
 */
export const startInspectionLotUdSchedular = () => {
    const schedule = process.env.SAP_UD_SCHEDULE || "*/1 * * * *";

    cron.schedule(schedule, async () => {
        try {
            console.log("[Inspection Lot UD Scheduler] Running...");
            const summary = await postPendingInspectionLotUds();
            console.log(
                `[Inspection Lot UD Scheduler] Done. total=${summary.total} posted=${summary.posted} failed=${summary.failed}`
            );
        } catch (error) {
            console.error("[Inspection Lot UD Scheduler] Error:", error.message);
        }
    });

    console.log(`[Inspection Lot UD Scheduler] Started (cron "${schedule}")`);
};
