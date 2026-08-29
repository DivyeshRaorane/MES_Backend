import {
  createScheduledMailS,
  getScheduledMailsS,
  cancelScheduledMailS,
  deleteScheduledMailS,
} from "../../../services/mail/mail_schedule.service.js";

/**
 * Create a new scheduled email
 * POST /api/mail/schedule
 */
export const createScheduledMailC = async (req, res) => {
  try {
    const { provider, to, cc, bcc, subject, text, html, templateName, templateVars, scheduledAt, recurrence } = req.body;

    if (!provider || !to || !subject || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "provider, to, subject, and scheduledAt are required fields",
      });
    }

    if (!["gmail", "org"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Use "gmail" or "org".',
      });
    }

    if (recurrence && !["once", "daily", "weekly", "monthly"].includes(recurrence)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recurrence. Use "once", "daily", "weekly", or "monthly".',
      });
    }

    const createdBy = req.user?.emp_id || null;

    const result = await createScheduledMailS({
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
      recurrence,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Email scheduled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create Scheduled Mail Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all scheduled emails
 * GET /api/mail/schedule
 */
export const getScheduledMailsC = async (req, res) => {
  try {
    const userId = req.user?.emp_id || null;
    const isAdmin = req.user?.role === "admin";

    const data = await getScheduledMailsS(userId, isAdmin);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Scheduled Mails Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Cancel a pending scheduled email
 * PUT /api/mail/schedule/:id/cancel
 */
export const cancelScheduledMailC = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.emp_id || null;

    const result = await cancelScheduledMailS(id, userId);

    return res.status(200).json({
      success: true,
      message: "Scheduled mail cancelled",
      data: result,
    });
  } catch (error) {
    console.error("Cancel Scheduled Mail Error:", error);

    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a scheduled email record
 * DELETE /api/mail/schedule/:id
 */
export const deleteScheduledMailC = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.emp_id || null;

    await deleteScheduledMailS(id, userId);

    return res.status(200).json({
      success: true,
      message: "Scheduled mail deleted",
    });
  } catch (error) {
    console.error("Delete Scheduled Mail Error:", error);

    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
