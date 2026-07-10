import pool from "../../db/postgres.js";

export const createShiftAdminS = async (data) => {
    const { shift_name, shift_start_time, shift_end_time } = data;
    const result = await pool.query(
        `INSERT INTO shifts (shift_name, shift_start_time, shift_end_time) VALUES ($1, $2, $3) RETURNING *`,
        [shift_name, shift_start_time, shift_end_time]
    );
    return result.rows[0];
};

export const updateShiftAdminS = async (shift_id, data) => {
    const { shift_name, shift_start_time, shift_end_time } = data;
    const result = await pool.query(
        `UPDATE shifts SET shift_name = $1, shift_start_time = $2, shift_end_time = $3 WHERE shift_id = $4 RETURNING *`,
        [shift_name, shift_start_time, shift_end_time, shift_id]
    );
    return result.rows[0];
};
