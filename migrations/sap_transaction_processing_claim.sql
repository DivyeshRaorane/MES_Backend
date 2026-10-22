-- ════════════════════════════════════════════════════════════════════
-- Concurrency claim columns for the `transactions` posting queue.
--
-- Why:
--   The posting scheduler runs on a short interval (default every 1 min).
--   A single run can take longer than that interval when there are many
--   pending rows, because each row is an independent (slow) SAP call. With
--   only the `status` flag, a second scheduler tick would start while the
--   first run is still working, read the SAME status = false rows, and post
--   them to SAP a second (and third) time — duplicate confirmations,
--   duplicate order_conf rows, double gr_qty.
--
-- How these columns fix it (claim-flag pattern):
--   Each run atomically "claims" all pending rows by setting processing = true
--   (stamping processing_started_at) in one quick transaction, then does the
--   slow SAP work with no lock held. A concurrent run only claims rows where
--   processing = false, so while a long run is in flight the next tick finds
--   nothing to claim and no-ops — it can never pick up a row another run
--   already owns, so no double posting.
--
--   processing            -> true while a run owns the row; cleared back to
--                            false on failure/skip so the row retries next run.
--                            A fully posted row is marked status = true (this
--                            flag is then irrelevant for it).
--   processing_started_at -> when the claim was taken, so a crash that leaves
--                            rows stuck at processing = true can be recovered
--                            by a stale-claim sweep (release claims older than
--                            a timeout at the start of each run).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS processing            BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP WITHOUT TIME ZONE;

-- The scheduler's claim query filters on "pending AND not claimed". Narrow the
-- existing pending index to also exclude claimed rows so the claim stays fast
-- as the queue grows.
DROP INDEX IF EXISTS idx_transactions_pending;

CREATE INDEX idx_transactions_pending
    ON transactions (transaction_id)
    WHERE status = false AND processing = false;
