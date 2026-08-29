import cron from "node-cron";
import { getPendingMailsS, processScheduledMailS } from "../services/mail/mail_schedule.service.js";

/**
 * Mail Scheduler - Runs every minute to process pending scheduled emails
 */
export const startMailSchedular = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const pendingMails = await getPendingMailsS();

      if (pendingMails.length === 0) return;

      console.log(`[Mail Scheduler] Processing ${pendingMails.length} pending mail(s)...`);

      for (const mail of pendingMails) {
        await processScheduledMailS(mail);
      }
    } catch (error) {
      console.error("[Mail Scheduler] Cron job error:", error.message);
    }
  });

  console.log("[Mail Scheduler] Started (runs every minute)");
};
