import express from "express";
import {
  sendMailC,
  sendGmailC,
  sendOrgMailC,
  verifyMailConnectionC,
  sendTemplateMailC,
  getMailTemplatesC,
} from "../../controller/postgres/mail/mail.controller.js";
import {
  createScheduledMailC,
  getScheduledMailsC,
  cancelScheduledMailC,
  deleteScheduledMailC,
} from "../../controller/postgres/mail/mail_schedule.controller.js";
import {
  createDraftC,
  getDraftsC,
  updateDraftC,
  deleteDraftC,
} from "../../controller/postgres/mail/mail_drafts.controller.js";
import { authMiddleware } from "../../middleware/aut_middleware.js";

const router = express.Router();

// Send email - generic (supports both gmail and org via provider field)
router.post("/mail/send", authMiddleware, sendMailC);

// Send email via Gmail specifically
router.post("/mail/send-gmail", authMiddleware, sendGmailC);

// Send email via Organization mail specifically
router.post("/mail/send-org", authMiddleware, sendOrgMailC);

// Send email using HTML template
router.post("/mail/send-template", authMiddleware, sendTemplateMailC);

// Verify mail connection (gmail or org)
router.get("/mail/verify/:provider", authMiddleware, verifyMailConnectionC);

// Get all available mail templates
router.get("/mail/templates", authMiddleware, getMailTemplatesC);

// === Scheduled Mail Endpoints ===

// Create a new scheduled email
router.post("/mail/schedule", authMiddleware, createScheduledMailC);

// Get all scheduled emails
router.get("/mail/schedule", authMiddleware, getScheduledMailsC);

// Cancel a pending scheduled email
router.put("/mail/schedule/:id/cancel", authMiddleware, cancelScheduledMailC);

// Delete a scheduled email record
router.delete("/mail/schedule/:id", authMiddleware, deleteScheduledMailC);

// === Mail Drafts Endpoints ===

// Save a new draft
router.post("/mail/drafts", authMiddleware, createDraftC);

// Get all saved drafts
router.get("/mail/drafts", authMiddleware, getDraftsC);

// Update a draft
router.put("/mail/drafts/:id", authMiddleware, updateDraftC);

// Delete a draft
router.delete("/mail/drafts/:id", authMiddleware, deleteDraftC);

export default router;
