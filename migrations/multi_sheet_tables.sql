-- Multi-Sheet Dynamic Report Builder - Database Migration
-- Run this AFTER the existing report_master table is already in place.

-- Add multi-sheet flag to existing report_master table
ALTER TABLE report_master ADD COLUMN IF NOT EXISTS is_multi_sheet BOOLEAN DEFAULT FALSE;

-- Report Sheets - child of report_master
CREATE TABLE IF NOT EXISTS report_sheets (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES report_master(id) ON DELETE CASCADE,
    sheet_name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Report Tables - child of report_sheets
CREATE TABLE IF NOT EXISTS report_tables (
    id SERIAL PRIMARY KEY,
    sheet_id INTEGER NOT NULL REFERENCES report_sheets(id) ON DELETE CASCADE,
    report_id INTEGER NOT NULL REFERENCES report_master(id) ON DELETE CASCADE,
    table_name VARCHAR(255) NOT NULL,
    main_table VARCHAR(255) NOT NULL,
    columns JSONB DEFAULT '[]',
    column_display_names JSONB DEFAULT '{}',
    column_order JSONB DEFAULT '[]',
    joins JSONB DEFAULT '[]',
    expressions JSONB DEFAULT '[]',
    filters JSONB DEFAULT '[]',
    sorting JSONB DEFAULT '[]',
    group_by JSONB DEFAULT '[]',
    aggregates JSONB DEFAULT '[]',
    having JSONB DEFAULT '[]',
    display_order INTEGER NOT NULL DEFAULT 1,
    spacing INTEGER DEFAULT 2,
    formatting JSONB DEFAULT '{"headerBold":true,"headerBgColor":"#1e293b","headerTextColor":"#ffffff","borderEnabled":true,"autoWidth":true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_sheets_report_id ON report_sheets(report_id);
CREATE INDEX IF NOT EXISTS idx_report_tables_sheet_id ON report_tables(sheet_id);
CREATE INDEX IF NOT EXISTS idx_report_tables_report_id ON report_tables(report_id);
CREATE INDEX IF NOT EXISTS idx_report_master_multi_sheet ON report_master(is_multi_sheet) WHERE is_multi_sheet = TRUE;
