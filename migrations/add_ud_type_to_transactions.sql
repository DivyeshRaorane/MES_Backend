-- Adds the ud_type sub-classification to transactions for type = 'UD' rows.
-- Also used (as a tag, not a UD post) on type = 'LTL' / 'MTM' rows so the
-- follow-up UD row queued after a successful LTL/MTM post inherits the
-- correct ud_type instead of being guessed from the from/to storage locations.
-- Safe to run on an existing database that already has the transactions table.
--
--   UD1 -> resolve UD code from qc_entry.temp_grade  (fg_batch = qc_entry.bobbin_no); skip row if not available
--   UD2 -> resolve UD code from qc_entry.final_grade (fg_batch = qc_entry.bobbin_no); skip row if not available
--   UD3 -> post UD code "A1" directly, no DB lookup (QC-out lane)
--   UD4 -> post UD code "A1" directly, no DB lookup (coloring lane)
--   UD5 -> post UD code "A2" directly, no DB lookup (rewinding lane)
--   UD6 -> post UD code "A1" directly, no DB lookup (MTM 309 follow-up lane)
--   NULL -> legacy behavior (postInspectionLotUd resolves grade itself)

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS ud_type VARCHAR(10);
