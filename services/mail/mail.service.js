import nodemailer from "nodemailer";
import { gmailConfig, orgMailConfig, mailDefaults } from "../../config/mail.config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create reusable transporter for Gmail
const gmailTransporter = nodemailer.createTransport(gmailConfig);

// Create reusable transporter for Organization Mail
const orgMailTransporter = nodemailer.createTransport(orgMailConfig);

/**
 * Get transporter based on provider type
 * @param {"gmail" | "org"} provider
 */
const getTransporter = (provider) => {
  switch (provider) {
    case "gmail":
      return gmailTransporter;
    case "org":
      return orgMailTransporter;
    default:
      throw new Error(`Invalid mail provider: ${provider}. Use "gmail" or "org".`);
  }
};

/**
 * Load HTML template and replace placeholders
 * @param {string} templateName - Template file name (without .html)
 * @param {object} variables - Key-value pairs to replace in template
 * @returns {string} Processed HTML string
 */
export const loadTemplate = (templateName, variables = {}) => {
  const templatePath = path.join(__dirname, "../../templates/mail", `${templateName}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template "${templateName}" not found at ${templatePath}`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");

  // Replace {{variable}} placeholders with actual values
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, variables[key]);
  });

  return html;
};

/**
 * Send email using specified provider
 * @param {object} options
 * @param {"gmail" | "org"} options.provider - Mail provider ("gmail" or "org")
 * @param {string} options.to - Recipient email(s), comma separated for multiple
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {string} [options.templateName] - Template name to use (overrides html)
 * @param {object} [options.templateVars] - Variables for template
 * @param {string} [options.cc] - CC recipients
 * @param {string} [options.bcc] - BCC recipients
 * @param {Array} [options.attachments] - Attachments array
 * @param {string} [options.from] - Custom from address (overrides default)
 * @returns {Promise<object>} Send result
 */
export const sendMailS = async (options) => {
  const { provider, to, subject, text, html, templateName, templateVars, cc, bcc, attachments, from } = options;

  if (!provider) throw new Error("Mail provider is required (gmail or org)");
  if (!to) throw new Error("Recipient (to) is required");
  if (!subject) throw new Error("Subject is required");

  const transporter = getTransporter(provider);
  const defaults = mailDefaults[provider];

  // Build HTML content from template if templateName is provided
  let htmlContent = html;
  if (templateName) {
    htmlContent = loadTemplate(templateName, templateVars || {});
  }

  // If neither html nor text is provided
  if (!htmlContent && !text) {
    throw new Error("Either text, html, or templateName is required");
  }

  const mailOptions = {
    from: from || defaults.from,
    to,
    subject,
    ...(text && { text }),
    ...(htmlContent && { html: htmlContent }),
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    ...(attachments && { attachments }),
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
};

/**
 * Send email via Gmail
 */
export const sendGmailS = async (options) => {
  return sendMailS({ ...options, provider: "gmail" });
};

/**
 * Send email via Organization mail
 */
export const sendOrgMailS = async (options) => {
  return sendMailS({ ...options, provider: "org" });
};

/**
 * Verify transporter connection
 * @param {"gmail" | "org"} provider
 * @returns {Promise<boolean>}
 */
export const verifyConnectionS = async (provider) => {
  const transporter = getTransporter(provider);
  await transporter.verify();
  return true;
};
