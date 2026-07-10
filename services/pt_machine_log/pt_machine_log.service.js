import pool from "../../db/postgres.js";

export const getByBobbinNoS = async (bobbin_no) => {
    const result = await pool.query(
        `SELECT spool_code_tu, set_length, real_length
         FROM pt_machine_logs
         WHERE spool_code_tu = $1
         ORDER BY processed_at DESC
         LIMIT 1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};
