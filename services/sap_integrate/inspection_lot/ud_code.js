/**
 * Centralized SAP Usage-Decision (UD) code mapping.
 *
 * A bobbin's `final_grade` decides which UD code is posted to SAP:
 *
 *     final_grade = 'REW'   ->  UD code "A2"   (rewind)
 *     final_grade = 'FAIL'  ->  UD code "R3"   (reject)
 *     anything else         ->  UD code "A1"   (accept / default)
 *
 * The three codes are overridable via environment variables so ops can retune
 * them without a code change:
 *
 *     SAP_UD_CODE_REW      (default "A2")
 *     SAP_UD_CODE_FAIL     (default "R3")
 *     SAP_UD_CODE_DEFAULT  (default "A1")
 *
 * This is the single source of truth for the grade -> UD code rule. Import
 * `resolveUdCode` anywhere a UD code must be derived from a grade — never
 * re-implement the mapping locally.
 */

/* ── canonical grade tokens ────────────────────────────────── */
export const GRADE_REW = "REW";
export const GRADE_FAIL = "FAIL";

/* ── env-overridable UD codes (read lazily so tests / runtime can set them) ── */
export const udCodeForRew = () => process.env.SAP_UD_CODE_REW || "A2";
export const udCodeForFail = () => process.env.SAP_UD_CODE_FAIL || "R3";
export const udCodeDefault = () => process.env.SAP_UD_CODE_DEFAULT || "A1";

/**
 * Normalize a raw grade value to a comparable token: trimmed + upper-cased.
 *
 * @param {*} finalGrade
 * @returns {string}
 */
export const normalizeGrade = (finalGrade) => String(finalGrade ?? "").trim().toUpperCase();

/**
 * Map a bobbin `final_grade` to its SAP UD code.
 *
 *   REW  -> A2
 *   FAIL -> R3
 *   else -> A1
 *
 * Matching is case-insensitive and tolerant of surrounding whitespace.
 *
 * @param {string} finalGrade
 * @returns {string} UD code
 */
export const resolveUdCode = (finalGrade) => {
    const g = normalizeGrade(finalGrade);
    if (g === GRADE_REW) return udCodeForRew();
    if (g === GRADE_FAIL) return udCodeForFail();
    return udCodeDefault();
};

export default resolveUdCode;
