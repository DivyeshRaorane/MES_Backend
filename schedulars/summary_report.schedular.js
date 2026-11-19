import cron from "node-cron";
import pool from "../db/postgres.js";

/**
 * Summary Report Scheduler - runs daily at 23:59 IST.
 *
 * Snapshots the day's figures into the summary tables that the Draw_Prod and
 * PT_Prod sheets of the production report read from:
 *   fn_insert_pt_summary_report   -> public.pt_summary_report
 *   fn_insert_draw_summary_report -> public.draw_summary_report
 *
 * CURRENT_DATE is evaluated by Postgres, whose timezone is Asia/Calcutta, so at
 * 23:59 IST it resolves to the day that is closing.
 *
 * Both functions upsert on their date (ON CONFLICT (day) DO UPDATE), so a retry
 * or a double run overwrites the row rather than duplicating it.
 *
 * Each function runs in its own try/catch: if one fails, the other still writes
 * its snapshot and the failure is logged with the function name.
 */

// Schedule is configurable via SUMMARY_REPORT_SCHEDULE (default: 23:59 daily).
const SCHEDULE = process.env.SUMMARY_REPORT_SCHEDULE || "59 23 * * *";
const TIMEZONE = process.env.SUMMARY_REPORT_TIMEZONE || "Asia/Kolkata";

/**
 * Note on fn_insert_pt_summary_report: its parameters are declared
 * (p_plan numeric DEFAULT 10000.000, p_date date DEFAULT CURRENT_DATE), with
 * the plan FIRST. Named notation is used so p_date is set and p_plan keeps its
 * default; passing CURRENT_DATE positionally would land in p_plan.
 */
const SNAPSHOT_STEPS = [
  {
    name: "fn_insert_pt_summary_report",
    sql: `SELECT public.fn_insert_pt_summary_report(p_date => CURRENT_DATE)`,
  },
  {
    name: "fn_insert_draw_summary_report",
    sql: `SELECT public.fn_insert_draw_summary_report(p_date => CURRENT_DATE)`,
  },
];

export const runSummaryReportSnapshot = async () => {
  const results = [];

  for (const step of SNAPSHOT_STEPS) {
    try {
      await pool.query(step.sql);
      console.log(`[Summary Report Scheduler] ${step.name} OK`);
      results.push({ name: step.name, ok: true });
    } catch (error) {
      console.error(`[Summary Report Scheduler] ${step.name} FAILED: ${error.message}`);
      results.push({ name: step.name, ok: false, error: error.message });
    }
  }

  return results;
};

export const startSummaryReportSchedular = () => {
  cron.schedule(
    SCHEDULE,
    async () => {
      console.log("[Summary Report Scheduler] Running...");
      const results = await runSummaryReportSnapshot();
      const failed = results.filter((r) => !r.ok);
      console.log(
        `[Summary Report Scheduler] Done. ok=${results.length - failed.length} failed=${failed.length}`
      );
    },
    { timezone: TIMEZONE }
  );

  console.log(`[Summary Report Scheduler] Started (cron "${SCHEDULE}", ${TIMEZONE})`);
};
