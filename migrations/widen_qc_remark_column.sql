-- Widens the `remark` column on qc_entry and qc_entry_temp so it can hold the
-- full cutting-instruction / free-text remark coming from the FG rewind popup.
--
-- Context: the rewind flow (POST /fg/rewind/submit) now sends the complete text
-- in `remark` for BOTH rewinding_type = CUT and REWINDING. For CUT this carries
-- the concatenated cutting instructions, e.g.
--   "Cut from 10 km to 20 km (h1310), Cut from 30 km to 35 km"
-- which can easily exceed a short varchar and raise
-- "value too long for type character varying(N)" on insert/update.
--
-- Widening is a safe, additive change (no data loss). Both columns remain
-- nullable — the REWINDING case may send remark = null when business rules allow.
-- Safe to run on an existing database.

ALTER TABLE public.qc_entry
    ALTER COLUMN remark TYPE character varying(500);

ALTER TABLE public.qc_entry_temp
    ALTER COLUMN remark TYPE character varying(500);
