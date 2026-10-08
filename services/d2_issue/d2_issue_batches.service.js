import pool from "../../db/postgres.js";

export const getD2BatchGradeExportS = async (d2_batch_id) => {
    try {
        // Determine whether this batch is an H2 batch.
        const batchResult = await pool.query(
            `SELECT is_h2 FROM d2_issue WHERE d2_batch_id = $1 LIMIT 1`,
            [d2_batch_id]
        );
        const isH2Batch = batchResult.rows[0]?.is_h2 === true;

        // Return all bobbins for the batch (regardless of final_grade),
        // keeping the scope filters: is_d2, and is_h2_after for H2 batches.
        const query = `
            SELECT bobbin_no, fid, product_type, temp_grade, final_grade
            FROM bobbin_entries
            WHERE d2_batch_id = $1
              AND is_d2 = true
              ${isH2Batch ? 'AND is_h2_after = true' : ''}
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
