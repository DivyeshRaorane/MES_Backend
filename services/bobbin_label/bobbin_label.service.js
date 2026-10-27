import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════════════════
// Bobbin Label / Sticker data service
//
// Returns label data for a batch of bobbins. Which optical parameters are
// *required* on the sticker depends on the requested `pattern` (1 | 2 | 3),
// but the full record (all available fields) is always returned per bobbin —
// the frontend only reads the fields it needs for the chosen pattern.
//
// Data sources (all keyed by bobbin_no unless noted):
//   packing_order_bobbin.length_km          -> length   (billed length)
//   bobbin_entries.fiber_color              -> fiber_color
//   bobbin_entries.preform_id               -> join key to preform_accept
//   preform_accept.material_description      -> fiber_info (heading text)
//   qc_entry.avg_lsa_atn_1310               -> attn1310
//   qc_entry.avg_lsa_atn_1550               -> attn1550
//   qc_entry.avg_lsa_atn_1383               -> attn1383
//   qc_entry.cut_off_top / cut_off_bottom   -> cutoff   (prefer top, else bottom)
//   qc_entry.mfd_1310_top                   -> mfd
//   bobbin_entries.final_grade_date         -> mfg      (formatted YYYY-MM)
// ═══════════════════════════════════════════════════════════════════════════

// Valid pattern IDs — keep in sync with the frontend's bobbinPatterns.js
export const VALID_PATTERNS = [1, 2, 3];

// Fields each pattern needs populated on the sticker. The query always returns
// every field; this map is documentation + lets us trim per pattern if desired.
const PATTERN_FIELDS = {
    1: ["attn1310", "attn1550", "cutoff", "mfd"],
    2: ["attn1310", "attn1550", "attn1383", "cutoff"],
    3: ["attn1310", "attn1550", "cutoff", "mfd"], // part_no handled on frontend
};

// Format a value to a plain string, leaving null/undefined as empty string so
// the frontend renders a blank. Numeric values are stringified as-is (the DB
// is expected to already hold the printed precision).
const toLabelValue = (v) => {
    if (v === null || v === undefined) return "";
    return String(v);
};

// Build "YYYY-MM" from a Date / timestamp. Returns "" when not available.
const toMfg = (ts) => {
    if (!ts) return "";
    const d = ts instanceof Date ? ts : new Date(ts);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

/**
 * Fetch label data for a batch of bobbins.
 *
 * @param {string[]} bobbinNos - trimmed, de-duplicated bobbin numbers
 * @param {number}   pattern   - 1 | 2 | 3
 * @returns {Promise<Array<Object>>} one record per *found* bobbin
 */
export const getBobbinLabelsS = async (bobbinNos, pattern) => {
    // Single batched query — WHERE bobbin_no = ANY(...) instead of N queries.
    const result = await pool.query(
        `
        SELECT
            be.bobbin_no,
            pa.material_description      AS fiber_info,
            be.fiber_color               AS fiber_color,
            pob.length_km                AS length,
            qc.avg_lsa_atn_1310          AS attn1310,
            qc.avg_lsa_atn_1550          AS attn1550,
            qc.avg_lsa_atn_1383          AS attn1383,
            COALESCE(qc.cut_off_top, qc.cut_off_bottom) AS cutoff,
            qc.mfd_1310_top              AS mfd,
            be.final_grade_date          AS mfg_date
        FROM bobbin_entries be
        LEFT JOIN packing_order_bobbin pob ON pob.bobbin_no = be.bobbin_no
        LEFT JOIN preform_accept pa        ON pa.preform_id = be.preform_id
        LEFT JOIN qc_entry qc              ON qc.bobbin_no = be.bobbin_no
        WHERE be.bobbin_no = ANY($1::text[])
        `,
        [bobbinNos]
    );

    const neededFields = PATTERN_FIELDS[pattern] || [];

    return result.rows.map((row) => {
        // Always return identity/heading fields.
        const record = {
            bobbin_no: row.bobbin_no,
            fiber_info: toLabelValue(row.fiber_info),
            fiber_color: toLabelValue(row.fiber_color),
            length: row.length ?? "",
            mfg: toMfg(row.mfg_date),
        };

        // Optical parameters — populate the ones this pattern needs. Fields not
        // required by the pattern are sent as empty string (frontend blanks them).
        record.attn1310 = neededFields.includes("attn1310") ? toLabelValue(row.attn1310) : "";
        record.attn1550 = neededFields.includes("attn1550") ? toLabelValue(row.attn1550) : "";
        record.attn1383 = neededFields.includes("attn1383") ? toLabelValue(row.attn1383) : "";
        record.cutoff = neededFields.includes("cutoff") ? toLabelValue(row.cutoff) : "";
        record.mfd = neededFields.includes("mfd") ? toLabelValue(row.mfd) : "";

        return record;
    });
};
