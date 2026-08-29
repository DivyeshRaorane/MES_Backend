import dotenv from "dotenv";
dotenv.config();

// Gmail Configuration
export const gmailConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
};

// Organization Mail Configuration (SMTP)
export const orgMailConfig = {
  host: process.env.ORG_MAIL_HOST,
  port: parseInt(process.env.ORG_MAIL_PORT) || 587,
  secure: process.env.ORG_MAIL_SECURE === "true", // true for 465
  auth: {
    user: process.env.ORG_MAIL_USER,
    pass: process.env.ORG_MAIL_PASSWORD,
  },
  // Optional: Skip TLS verification for self-signed certs (org servers)
  tls: {
    rejectUnauthorized: process.env.ORG_MAIL_TLS_REJECT === "false" ? false : true,
  },
};

// Default mail settings
export const mailDefaults = {
  gmail: {
    from: `"${process.env.GMAIL_FROM_NAME || "MES System"}" <${process.env.GMAIL_USER}>`,
  },
  org: {
    from: `"${process.env.ORG_MAIL_FROM_NAME || "MES System"}" <${process.env.ORG_MAIL_USER}>`,
  },
};
