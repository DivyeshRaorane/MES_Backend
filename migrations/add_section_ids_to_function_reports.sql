-- Migration: Ensure section column is TEXT (for comma-separated multi-section storage)
-- Example value: 'Draw,QC,Packing'
-- No schema change needed if section is already TEXT/VARCHAR.
-- This migration is a no-op safety check.

ALTER TABLE function_reports
ALTER COLUMN section TYPE TEXT;
