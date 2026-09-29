-- Adds fg_location to transactions for type = 'FG' rows.
-- Populated on insertSapTransaction when the caller provides fg_location;
-- carried through to SAP FG confirmation postings as FG_sloc on the payload.
-- Safe to run on an existing database that already has the transactions table.

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS fg_location VARCHAR(10);
