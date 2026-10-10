import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════
// D2 ISSUE — backend batch / draft ID generation
// ═══════════════════════════════════════════════════════════════
//
// Two independent per-(chamber, date) number series:
//
//   draft : "{chamber}-{YYYYMMDD}-draft{NN}"  -> d2_issue_draft.d2_batch_id
//   final : "{chamber}-{YYYYMMDD}-{NN}"        -> d2_issue.d2_batch_id
//
// NN = (max existing numeric suffix for that chamber+date) + 1, zero-padded
// to 2 digits, overflowing naturally to 3+ digits past 99. The suffix is
// parsed from the segment after the last "-" (with the "draft" prefix
// stripped for the draft series) so deleted rows never cause collisions.
//
// Concurrency: every candidate id is reserved in d2_batch_id_seq, which has a
// UNIQUE(d2_batch_id) + UNIQUE(series, chamber, seq_date, seq) constraint. If
// two requests race for the same chamber+date, one insert raises a
// unique-violation (SQLSTATE 23505); we recompute the next suffix and retry.

const PG_UNIQUE_VIOLATION = "23505";
const MAX_RETRIES = 8;

/**
 * Server-local date formatted as YYYYMMDD for the id segment.
 * @param {Date} [date]
 */
export const formatYmd = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
};

/**
 * Server-local date as YYYY-MM-DD for the DATE column scope.
 * @param {Date} [date]
 */
export const toLocalDateString = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * Highest numeric suffix already reserved for a series+chamber+date, 0 if none.
 * Reads from the reservation table, which is the authoritative record for
 * both series regardless of row deletions in the draft/issue tables.
 */
const getMaxSeq = async (client, series, chamber, seqDate) => {
    const result = await client.query(
        `SELECT COALESCE(MAX(seq), 0) AS max_seq
           FROM d2_batch_id_seq
          WHERE series = $1 AND chamber = $2 AND seq_date = $3`,
        [series, chamber, seqDate]
    );
    return Number(result.rows[0]?.max_seq) || 0;
};

/**
 * Reserve the next id for a series. Returns the generated id string.
 * Retries on unique-violation so concurrent callers can't collide.
 *
 * @param {('draft'|'final')} series
 * @param {number|string} chamber
 * @param {Date} [date]  server-local date for the id scope
 */
const reserveNextId = async (series, chamber, date = new Date()) => {
    const chamberNo = Number(chamber);
    if (!Number.isFinite(chamberNo)) {
        throw new Error("A valid chamber is required to generate a D2 batch id.");
    }

    const ymd = formatYmd(date);
    const seqDate = toLocalDateString(date);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const nextSeq = (await getMaxSeq(client, series, chamberNo, seqDate)) + 1;
            const suffix =
                series === "draft" ? `draft${pad2(nextSeq)}` : pad2(nextSeq);
            const d2_batch_id = `${chamberNo}-${ymd}-${suffix}`;

            await client.query(
                `INSERT INTO d2_batch_id_seq (series, chamber, seq_date, seq, d2_batch_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [series, chamberNo, seqDate, nextSeq, d2_batch_id]
            );

            await client.query("COMMIT");
            return d2_batch_id;
        } catch (err) {
            await client.query("ROLLBACK");
            if (err && err.code === PG_UNIQUE_VIOLATION) {
                // Concurrent reservation took this number — recompute and retry.
                continue;
            }
            throw err;
        } finally {
            client.release();
        }
    }

    throw new Error(
        `Could not generate a unique D2 ${series} batch id after ${MAX_RETRIES} attempts.`
    );
};

/**
 * Next draft id: "{chamber}-{YYYYMMDD}-draft{NN}".
 */
export const generateNextDraftId = (chamber, date = new Date()) =>
    reserveNextId("draft", chamber, date);

/**
 * Next final batch id: "{chamber}-{YYYYMMDD}-{NN}".
 * `date` should be the submit date (d2_start_date) when provided.
 */
export const generateNextFinalBatchId = (chamber, date = new Date()) =>
    reserveNextId("final", chamber, date);

/**
 * Parse a date-like input (Date, 'YYYY-MM-DD', or ISO string) to a local Date.
 * Falls back to "now" when the input is missing or unparseable so id
 * generation never throws on a bad date segment.
 */
export const parseDateOrNow = (input) => {
    if (!input) return new Date();
    if (input instanceof Date) return Number.isNaN(input.getTime()) ? new Date() : input;

    // Plain "YYYY-MM-DD" -> construct a local date (avoid UTC shift).
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(input));
    if (m) {
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }

    const parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
