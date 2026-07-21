import pool from "../../db/postgres.js";

export const getSpecListS = async () => {
    const result = await pool.query(
        `SELECT * FROM spec_master WHERE is_active = TRUE ORDER BY spec_id DESC`
    );
    return result.rows;
};

export const getSpecByIdS = async (id) => {
    const result = await pool.query(`SELECT * FROM spec_master WHERE spec_id = $1`, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
};

export const createSpecS = async (payload) => {
    const { logged_in_user, ...data } = payload;

    const keys = Object.keys(data);
    const values = keys.map(k => data[k] === '' ? null : data[k]);
    keys.push('created_by');
    values.push(logged_in_user);

    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');

    const result = await pool.query(
        `INSERT INTO spec_master (${keys.join(',')}) VALUES (${placeholders}) RETURNING spec_id`,
        values
    );

    return { success: true, message: "Specification created", spec_id: result.rows[0].spec_id };
};

export const updateSpecS = async (id, payload) => {
    const { logged_in_user, ...data } = payload;

    const keys = Object.keys(data);
    const values = keys.map(k => data[k] === '' ? null : data[k]);

    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);

    await pool.query(
        `UPDATE spec_master SET ${setClause}, updated_at = NOW() WHERE spec_id = $${values.length}`,
        values
    );

    return { success: true, message: "Specification updated" };
};

export const deactivateSpecS = async (id) => {
    await pool.query(
        `UPDATE spec_master SET is_active = FALSE, updated_at = NOW() WHERE spec_id = $1`, [id]
    );
    return { success: true, message: "Specification deactivated" };
};
