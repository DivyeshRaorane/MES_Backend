import pool from "../../../db/postgres.js";

/**
 * User Decision (pending inspection-lot) Service
 *
 * A bobbin is "pending a user decision" when it has a row in order_conf with a
 * non-null inspection_lot and the usage decision has not yet been made.
 *
 * NOTE on the "status" flag:
 *   order_conf has no `status` column. The usage-decision flag on this table is
 *   `ud boolean default false` — it is flipped to true once the UD is posted to
 *   SAP (see inspection_lot_ud.service.js -> markOrderConfUd). So the requested
 *   "status = false" maps to `ud = false` here. inspection_lot = 0 is also
 *   treated as "no lot" since it is a placeholder, not a real lot. Rows must
 *   also have ud_required = true to be actionable.
 *
 * NOTE on the bobbin_entries join:
 *   order_conf.fg_batch holds the FG bobbin_no (see pt_entry / rewinding /
 *   inspection_lot_ud_batch services where fg_batch = bobbin_no), so bobbins are
 *   joined with:
 *        bobbin_entries.bobbin_no = order_conf.fg_batch
 *   Only bobbins whose final_grade is present (NOT NULL and not empty/blank)
 *   are pending a user decision, mirroring the UD batch/scheduler logic.
 */

const str = (v) => (v === undefined || v === null ? null : String(v).trim());

/**
 * Fetch all bobbins awaiting a user decision.
 *
 * @param {object} [filters]
 * @param {string} [filters.bobbin_no]       partial (case-insensitive) match on fg_batch
 * @param {string} [filters.inspection_lot]  exact inspection lot match
 * @returns {Promise<Array<{
 *   bobbin_no: string|null,
 *   inspection_lot: string,
 *   optical_length: number|null,
 *   final_grade: string|null,
 *   product_type: string|null
 * }>>}
 */
export const getPendingUserDecisionsS = async (filters = {}) => {
    const bobbinNo = str(filters.bobbin_no);
    const inspectionLot = str(filters.inspection_lot);

    const params = [];
    const where = [
        "oc.inspection_lot IS NOT NULL",
        "oc.inspection_lot <> 0",
        "oc.ud_required = true",
        "COALESCE(oc.ud, false) = false",
        "be.final_grade IS NOT NULL",
        "btrim(be.final_grade) <> ''",
    ];

    if (inspectionLot) {
        const lotInt = parseInt(inspectionLot.replace(/[^\d-]/g, ""), 10);
        if (Number.isNaN(lotInt)) {
            // Non-numeric inspection lot can never match a bigint column.
            return [];
        }
        params.push(lotInt);
        where.push(`oc.inspection_lot = $${params.length}`);
    }

    if (bobbinNo) {
        params.push(`%${bobbinNo}%`);
        where.push(`oc.fg_batch ILIKE $${params.length}`);
    }

    const query = `
        SELECT
            oc.fg_batch::text         AS bobbin_no,
            oc.inspection_lot::text   AS inspection_lot,
            be.optical_length         AS optical_length,
            be.final_grade            AS final_grade,
            be.product_type           AS product_type
        FROM order_conf oc
        JOIN bobbin_entries be
             ON be.bobbin_no = oc.fg_batch
        WHERE ${where.join("\n          AND ")}
        ORDER BY oc.inspection_lot ASC, oc.fg_batch ASC
    `;

    const result = await pool.query(query, params);
    return result.rows;
};

export default getPendingUserDecisionsS;
