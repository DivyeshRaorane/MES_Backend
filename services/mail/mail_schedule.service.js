import pool from "../../db/postgres.js";
import { sendMailS } from "./mail.service.js";
import { generateProductionReportS } from "../reports/production_report.service.js";

/**
 * Create a scheduled mail entry
 */
export const createScheduledMailS = async (data) => {
  const {
    provider,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    templateName,
    templateVars,
    scheduledAt,
    recurrence = "once",
    createdBy,
  } = data;

  // Validate scheduledAt is in the future
  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    throw new Error("scheduledAt must be a future date/time");
  }

  const query = `
    INSERT INTO scheduled_mails 
      (provider, "to", cc, bcc, subject, text, html, template_name, template_vars, scheduled_at, recurrence, next_run_at, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $10, $12)
    RETURNING id, provider, "to", subject, scheduled_at, recurrence, status, next_run_at, created_at
  `;

  const values = [
    provider,
    to,
    cc || null,
    bcc || null,
    subject,
    text || null,
    html || null,
    templateName || null,
    templateVars ? JSON.stringify(templateVars) : null,
    scheduledDate,
    recurrence,
    createdBy || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get all scheduled mails (optionally filter by user)
 */
export const getScheduledMailsS = async (userId, isAdmin = false) => {
  let query;
  let values;

  if (isAdmin) {
    query = `SELECT * FROM scheduled_mails ORDER BY created_at DESC`;
    values = [];
  } else {
    query = `SELECT * FROM scheduled_mails WHERE created_by = $1 ORDER BY created_at DESC`;
    values = [userId];
  }

  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Cancel a scheduled mail (set status to 'cancelled')
 */
export const cancelScheduledMailS = async (id, userId) => {
  // Check if record exists and is pending
  const checkQuery = `SELECT id, status, created_by FROM scheduled_mails WHERE id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);

  if (checkResult.rows.length === 0) {
    throw new Error("Scheduled mail not found");
  }

  const record = checkResult.rows[0];

  if (record.status !== "pending") {
    throw new Error(`Cannot cancel mail with status: ${record.status}. Only pending mails can be cancelled.`);
  }

  const updateQuery = `
    UPDATE scheduled_mails 
    SET status = 'cancelled', updated_at = NOW() 
    WHERE id = $1 
    RETURNING id, status, updated_at
  `;

  const result = await pool.query(updateQuery, [id]);
  return result.rows[0];
};

/**
 * Delete a scheduled mail record (only if not pending)
 */
export const deleteScheduledMailS = async (id, userId) => {
  // Check if record exists
  const checkQuery = `SELECT id, status, created_by FROM scheduled_mails WHERE id = $1`;
  const checkResult = await pool.query(checkQuery, [id]);

  if (checkResult.rows.length === 0) {
    throw new Error("Scheduled mail not found");
  }

  const record = checkResult.rows[0];

  if (record.status === "pending") {
    throw new Error("Cannot delete a pending scheduled mail. Cancel it first.");
  }

  const deleteQuery = `DELETE FROM scheduled_mails WHERE id = $1`;
  await pool.query(deleteQuery, [id]);

  return { id, deleted: true };
};

/**
 * Get pending mails that are due for sending (used by cron job)
 */
export const getPendingMailsS = async () => {
  const query = `
    SELECT * FROM scheduled_mails 
    WHERE status = 'pending' AND next_run_at <= NOW()
    ORDER BY next_run_at ASC
  `;

  const result = await pool.query(query);
  return result.rows;
};

/**
 * Process a single scheduled mail - send and update status
 */
export const processScheduledMailS = async (mail) => {
  try {
    // Build mail options
    const mailOptions = {
      provider: mail.provider,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      templateName: mail.template_name,
      templateVars: mail.template_vars,
      cc: mail.cc,
      bcc: mail.bcc,
    };

    // If template is production_report, generate Excel and attach it
    if (mail.template_name === "production_report") {
      const reportDate = mail.template_vars?.reportDate || new Date().toISOString().split("T")[0];
      
      // Auto-fill template variables
      mailOptions.templateVars = {
        ...mail.template_vars,
        reportDate: reportDate,
        generatedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        preparedBy: mail.template_vars?.preparedBy || "MES System",
        year: new Date().getFullYear().toString(),
      };

      // Generate Excel report
      const { buffer, fileName } = await generateProductionReportS(reportDate);

      mailOptions.attachments = [
        {
          filename: fileName,
          content: Buffer.from(buffer),
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ];
    }

    // Send the email using existing mail service
    await sendMailS(mailOptions);

    // Update based on recurrence
    if (mail.recurrence === "once") {
      // One-time mail: mark as sent
      await pool.query(
        `UPDATE scheduled_mails SET status = 'sent', last_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [mail.id]
      );
    } else {
      // Recurring mail: calculate next_run_at
      const nextRun = calculateNextRun(mail.next_run_at, mail.recurrence);
      await pool.query(
        `UPDATE scheduled_mails SET last_sent_at = NOW(), next_run_at = $1, updated_at = NOW() WHERE id = $2`,
        [nextRun, mail.id]
      );
    }

    console.log(`[Mail Scheduler] Sent mail #${mail.id} to ${mail.to}`);
  } catch (error) {
    // Mark as failed with error message
    await pool.query(
      `UPDATE scheduled_mails SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
      [error.message, mail.id]
    );
    console.error(`[Mail Scheduler] Failed mail #${mail.id}:`, error.message);
  }
};

/**
 * Calculate next run time based on recurrence type
 */
const calculateNextRun = (currentRunAt, recurrence) => {
  const current = new Date(currentRunAt);

  switch (recurrence) {
    case "daily":
      current.setDate(current.getDate() + 1);
      break;
    case "weekly":
      current.setDate(current.getDate() + 7);
      break;
    case "monthly":
      current.setDate(current.getDate() + 30);
      break;
    default:
      break;
  }

  return current;
};
