import { createDraftS, getDraftsS, updateDraftS, deleteDraftS } from "../../../services/mail/mail_drafts.service.js";

/**
 * Save a new draft
 * POST /api/mail/drafts
 */
export const createDraftC = async (req, res) => {
  try {
    const { draft_name, provider, to, cc, bcc, subject, text, html, templateName, templateVars } = req.body;

    if (!draft_name || !provider || !to || !subject) {
      return res.status(400).json({
        success: false,
        message: "draft_name, provider, to, and subject are required fields",
      });
    }

    if (!["gmail", "org"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Use "gmail" or "org".',
      });
    }

    const createdBy = req.user?.emp_id || null;

    const result = await createDraftS({
      draftName: draft_name,
      provider,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      templateName,
      templateVars,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Draft saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create Draft Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all saved drafts
 * GET /api/mail/drafts
 */
export const getDraftsC = async (req, res) => {
  try {
    const userId = req.user?.emp_id || null;
    const isAdmin = req.user?.role === "admin";

    const data = await getDraftsS(userId, isAdmin);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Drafts Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update a draft
 * PUT /api/mail/drafts/:id
 */
export const updateDraftC = async (req, res) => {
  try {
    const { id } = req.params;
    const { draft_name, provider, to, cc, bcc, subject, text, html, templateName, templateVars } = req.body;

    if (!draft_name || !provider || !to || !subject) {
      return res.status(400).json({
        success: false,
        message: "draft_name, provider, to, and subject are required fields",
      });
    }

    const userId = req.user?.emp_id || null;

    const result = await updateDraftS(
      id,
      { draftName: draft_name, provider, to, cc, bcc, subject, text, html, templateName, templateVars },
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Draft updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update Draft Error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a draft
 * DELETE /api/mail/drafts/:id
 */
export const deleteDraftC = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.emp_id || null;

    await deleteDraftS(id, userId);

    return res.status(200).json({
      success: true,
      message: "Draft deleted successfully",
    });
  } catch (error) {
    console.error("Delete Draft Error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
