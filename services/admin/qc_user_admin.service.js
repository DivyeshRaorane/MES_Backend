import pool from "../../db/postgres.js";

export const getAllQcUsersAdminS = async () => {
    const result = await pool.query(`SELECT * FROM qc_users ORDER BY qc_user_id DESC`);
    return result.rows;
};

export const createQcUserAdminS = async (data) => {
    const { qc_user_name } = data;

    // Check for duplicate name
    const dupCheck = await pool.query(
        `SELECT qc_user_id FROM qc_users WHERE LOWER(qc_user_name) = LOWER($1) LIMIT 1`,
        [qc_user_name]
    );

    if (dupCheck.rows.length > 0) {
        throw new Error(`QC User "${qc_user_name}" already exists.`);
    }

    const result = await pool.query(
        `INSERT INTO qc_users (qc_user_name) VALUES ($1) RETURNING *`,
        [qc_user_name]
    );
    return result.rows[0];
};

export const updateQcUserAdminS = async (qc_user_id, data) => {
    const keys = Object.keys(data);
    const values = keys.map(k => (data[k] === '' || data[k] === undefined) ? null : data[k]);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(qc_user_id);

    const result = await pool.query(
        `UPDATE qc_users SET ${setClause} WHERE qc_user_id = $${values.length} RETURNING *`,
        values
    );
    return result.rows[0];
};
