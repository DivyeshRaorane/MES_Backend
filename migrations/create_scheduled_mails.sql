-- Migration: Create scheduled_mails table
-- Date: 2026-08-24

CREATE TABLE IF NOT EXISTS scheduled_mails (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(10) NOT NULL CHECK (provider IN ('gmail', 'org')),
  "to" VARCHAR(500) NOT NULL,
  cc VARCHAR(500),
  bcc VARCHAR(500),
  subject VARCHAR(500) NOT NULL,
  text TEXT,
  html TEXT,
  template_name VARCHAR(100),
  template_vars JSONB,
  scheduled_at TIMESTAMP NOT NULL,
  recurrence VARCHAR(20) DEFAULT 'once' CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  last_sent_at TIMESTAMP,
  next_run_at TIMESTAMP,
  error_message TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for cron job query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_mails_pending ON scheduled_mails (status, next_run_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_mails_created_by ON scheduled_mails (created_by);
