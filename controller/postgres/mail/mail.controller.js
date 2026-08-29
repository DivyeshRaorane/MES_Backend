import { sendMailS, sendGmailS, sendOrgMailS, verifyConnectionS } from "../../../services/mail/mail.service.js";

/**
 * Send email - Generic (supports both gmail and org)
 * POST /api/mail/send
 */
export const sendMailC = async (req, res) => {
  try {
    const { provider, to, subject, text, html, templateName, templateVars, cc, bcc } = req.body;

    if (!provider || !to || !subject) {
      return res.status(400).json({
        success: false,
        message: "provider, to, and subject are required fields",
      });
    }

    const result = await sendMailS({
      provider,
      to,
      subject,
      text,
      html,
      templateName,
      templateVars,
      cc,
      bcc,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send Mail Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send email via Gmail
 * POST /api/mail/send-gmail
 */
export const sendGmailC = async (req, res) => {
  try {
    const { to, subject, text, html, templateName, templateVars, cc, bcc } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: "to and subject are required fields",
      });
    }

    const result = await sendGmailS({
      to,
      subject,
      text,
      html,
      templateName,
      templateVars,
      cc,
      bcc,
    });

    return res.status(200).json({
      success: true,
      message: "Gmail sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send Gmail Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send email via Organization Mail
 * POST /api/mail/send-org
 */
export const sendOrgMailC = async (req, res) => {
  try {
    const { to, subject, text, html, templateName, templateVars, cc, bcc } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: "to and subject are required fields",
      });
    }

    const result = await sendOrgMailS({
      to,
      subject,
      text,
      html,
      templateName,
      templateVars,
      cc,
      bcc,
    });

    return res.status(200).json({
      success: true,
      message: "Organization mail sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send Org Mail Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify mail connection
 * GET /api/mail/verify/:provider
 */
export const verifyMailConnectionC = async (req, res) => {
  try {
    const { provider } = req.params;

    if (!["gmail", "org"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Use "gmail" or "org".',
      });
    }

    await verifyConnectionS(provider);

    return res.status(200).json({
      success: true,
      message: `${provider} mail connection verified successfully`,
    });
  } catch (error) {
    console.error("Mail Verify Error:", error.message);
    return res.status(500).json({
      success: false,
      message: `Mail connection failed: ${error.message}`,
    });
  }
};

/**
 * Send email with template
 * POST /api/mail/send-template
 */
export const sendTemplateMailC = async (req, res) => {
  try {
    const { provider, to, subject, templateName, templateVars, cc, bcc } = req.body;

    if (!provider || !to || !subject || !templateName) {
      return res.status(400).json({
        success: false,
        message: "provider, to, subject, and templateName are required fields",
      });
    }

    const mailOptions = {
      provider,
      to,
      subject,
      templateName,
      templateVars,
      cc,
      bcc,
    };

    // If production_report template, generate Excel and attach
    if (templateName === "production_report") {
      const { generateProductionReportS } = await import("../../../services/reports/production_report.service.js");
      const reportDate = templateVars?.reportDate || new Date().toISOString().split("T")[0];

      mailOptions.templateVars = {
        ...templateVars,
        reportDate,
        generatedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        preparedBy: templateVars?.preparedBy || "MES System",
        year: new Date().getFullYear().toString(),
      };

      const { buffer, fileName } = await generateProductionReportS(reportDate);
      mailOptions.attachments = [
        {
          filename: fileName,
          content: Buffer.from(buffer),
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ];
    }

    const result = await sendMailS(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Template email sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send Template Mail Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all available mail templates
 * GET /api/mail/templates
 */
export const getMailTemplatesC = async (req, res) => {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.default.dirname(__filename);
    const templatesDir = path.default.join(__dirname, "../../../templates/mail");

    const files = fs.default.readdirSync(templatesDir).filter((f) => f.endsWith(".html"));

    const templates = files.map((file) => {
      const name = file.replace(".html", "");
      const content = fs.default.readFileSync(path.default.join(templatesDir, file), "utf-8");

      // Extract template variables ({{variableName}} patterns)
      const varMatches = content.match(/{{(\w+)}}/g) || [];
      const variables = [...new Set(varMatches.map((v) => v.replace(/[{}]/g, "")))];

      return {
        name,
        fileName: file,
        variables,
      };
    });

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Get Templates Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
