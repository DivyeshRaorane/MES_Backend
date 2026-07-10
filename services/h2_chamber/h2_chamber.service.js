import pool from "../../db/postgres.js";

export const createH2ChamberS = async (data) => {
    const { h2_chamber_no } = data;

    const query = `
    INSERT INTO h2_chamber(h2_chamber_no)
    VALUES ($1)
    RETURNING *;
    `;

    const result = await pool.query(query, [h2_chamber_no]);
    return result.rows[0];
};

export const getH2ChambersByStatusS = async (is_active) => {
    const query = `
    SELECT * FROM h2_chamber
    WHERE is_active = $1
    ORDER BY h2_chamber_no ASC;
    `;

    const result = await pool.query(query, [is_active]);
    return result.rows;
};
