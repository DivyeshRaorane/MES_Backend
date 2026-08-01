import pool from "../../db/postgres.js";

// GET /api/fiber-cut-reasons — with optional indication_id filter
export const getFilteredFiberCutReasonsS = async (indication_id) => {
    if (indication_id) {
        const result = await pool.query(
            `SELECT r.*, i.indication_name
             FROM d_fiber_cut_reasons r
             LEFT JOIN fiber_cut_indication i ON r.indication_fiber_cut_id = i.indication_fiber_cut_id
             WHERE r.disable = false AND r.indication_fiber_cut_id = $1
             ORDER BY r.dfcr_name`,
            [indication_id]
        );
        return result.rows;
    }

    const result = await pool.query(
        `SELECT r.*, i.indication_name
         FROM d_fiber_cut_reasons r
         LEFT JOIN fiber_cut_indication i ON r.indication_fiber_cut_id = i.indication_fiber_cut_id
         WHERE r.disable = false
         ORDER BY r.dfcr_name`
    );
    return result.rows;
};
