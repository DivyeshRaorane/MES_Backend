import pool from "../../db/postgres.js";

export const getGradeMandatoryS = async (grade, product_type) => {
    const query = `
        SELECT * FROM grade_mandatory
        WHERE grade = $1 AND product_type = $2;
    `;

    const result = await pool.query(query, [grade, product_type]);
    return result.rows[0] || null;
};

export const upsertGradeMandatoryS = async (payload) => {
    const { grade, product_type, mandatory_params } = payload;

    // Check if row exists
    const existing = await pool.query(
        `SELECT grade_mandatory_id FROM grade_mandatory WHERE grade = $1 AND product_type = $2`,
        [grade, product_type]
    );

    if (existing.rows.length > 0) {
        await pool.query(
            `UPDATE grade_mandatory SET mandatory_params = $1, updated_at = NOW() WHERE grade = $2 AND product_type = $3`,
            [mandatory_params || '', grade, product_type]
        );
    } else {
        await pool.query(
            `INSERT INTO grade_mandatory (grade, product_type, mandatory_params) VALUES ($1, $2, $3)`,
            [grade, product_type, mandatory_params || '']
        );
    }
};
