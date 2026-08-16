import pool from "../../db/postgres.js";

export const getD2BatchGradeExportS = async (d2_batch_id) => {
    try {
        const query = `
            SELECT bobbin_no, fid, product_type, temp_grade
            FROM bobbin_entries
            WHERE d2_batch_id = $1
              AND (final_grade IS NULL OR final_grade = '')
              AND is_d2 = true
        `;

        const result = await pool.query(query, [d2_batch_id]);
        return result.rows;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const getD2IssueBatchesS = async (from, to) => {
    try {
        const query = `
            SELECT 
                d2_batch_id, 
                chamber, 
                d2_start_date, 
                d2_start_time, 
                d2_end_date, 
                d2_end_time,
                process_hours, 
                start_operator, 
                end_operator, 
                d2_type,
                is_h2,
                COUNT(*) AS bobbin_count
            FROM d2_issue
            WHERE d2_end_date IS NOT NULL
              AND d2_end_date BETWEEN $1 AND $2
            GROUP BY d2_batch_id, chamber, d2_start_date, d2_start_time, 
                     d2_end_date, d2_end_time, process_hours, is_h2,
                     start_operator, end_operator, d2_type
            ORDER BY d2_end_date DESC
        `;

        const result = await pool.query(query, [from, to]);
        return result.rows;
    } catch (error) {
        throw new Error(error.message);
    }
};
