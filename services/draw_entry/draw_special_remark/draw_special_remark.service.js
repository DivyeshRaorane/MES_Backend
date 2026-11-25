import pool from "../../../db/postgres.js";

// Insert a new remark
export const insertDrawSpecialRemarkS = async ({ s_d_remark, is_disable = false }) => {
    const result = await pool.query(
        `INSERT INTO draw_special_remark (s_d_remark, is_disable)
         VALUES ($1, $2)
         RETURNING *`,
        [s_d_remark, is_disable]
    );
    return result.rows[0];
};

// Get remarks filtered by is_disable (true / false)
export const getDrawSpecialRemarkS = async ({ is_disable }) => {
    const flag = is_disable === true || is_disable === "true";
    const result = await pool.query(
        `SELECT id, s_d_remark, is_disable
         FROM draw_special_remark
         WHERE is_disable = $1
         ORDER BY id`,
        [flag]
    );
    return result.rows;
};

// Update is_disable (true / false) by id
export const updateDrawSpecialRemarkDisableS = async ({ id, is_disable }) => {
    const flag = is_disable === true || is_disable === "true";
    const result = await pool.query(
        `UPDATE draw_special_remark
         SET is_disable = $1
         WHERE id = $2
         RETURNING *`,
        [flag, id]
    );
    return result.rows[0] || null;
};

// Edit s_d_remark by id
export const updateDrawSpecialRemarkTextS = async ({ id, s_d_remark }) => {
    const result = await pool.query(
        `UPDATE draw_special_remark
         SET s_d_remark = $1
         WHERE id = $2
         RETURNING *`,
        [s_d_remark, id]
    );
    return result.rows[0] || null;
};
