import pool from "../../db/postgres.js";

export const createQcUserS = async (data) => {
    const { emp_id, qc_user_name } = data;

    const query = `
    INSERT INTO qc_users(emp_id, qc_user_name)
    VALUES ($1, $2)
    RETURNING *;
    `;

    const result = await pool.query(query, [emp_id, qc_user_name]);
    return result.rows[0];
};

export const getAllQcUsersS = async () => {
    const query = `
    SELECT * FROM qc_users
    ORDER BY qc_user_id DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
};
