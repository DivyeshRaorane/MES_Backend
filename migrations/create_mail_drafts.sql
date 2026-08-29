-- Migration: Create mail_drafts table
-- Date: 2026-08-24

CREATE TABLE IF NOT EXISTS mail_drafts (
  id SERIAL PRIMARY KEY,
  draft_name VARCHAR(200) NOT NULL,
  provider VARCHAR(10) NOT NULL CHECK (provider IN ('gmail', 'org')),
  "to" VARCHAR(500) NOT NULL,
  cc VARCHAR(500),
  bcc VARCHAR(500),
  subject VARCHAR(500) NOT NULL,
  text TEXT,
  html TEXT,
  template_name VARCHAR(100),
  template_vars JSONB,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_drafts_created_by ON mail_drafts (created_by);
