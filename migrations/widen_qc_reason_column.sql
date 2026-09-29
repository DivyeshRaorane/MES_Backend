-- Widens the `reason` column on qc_entry and qc_entry_temp so it can hold
-- operator-typed free text coming from the QC Entry Rewinding popup.
--
-- Context: the simplified qcEntry.jsx REW flow now sends a plain `reason`
-- string (Whole Length rewind case) via POST /qcentry/submit. The column
-- already existed as varchar(20), which is too small for free text and would
-- raise "value too long for type character varying(20)" on insert/update.
--
-- Widening is a safe, additive change (no data loss). Both columns remain
-- nullable — the CUT rewind case sends reason = null.
-- Safe to run on an existing database.

ALTER TABLE public.qc_entry
    ALTER COLUMN reason TYPE character varying(300);

ALTER TABLE public.qc_entry_temp
    ALTER COLUMN reason TYPE character varying(300);
