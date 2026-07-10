import pool from "../../db/postgres.js";

export const createD2ChamberS = async (data) => {
    const { d2_chamber_no } = data;

    const query = `
    INSERT INTO d2_chamber(d2_chamber_no)
    VALUES ($1)
    RETURNING *;
    `;

    const result = await pool.query(query, [d2_chamber_no]);
    return result.rows[0];
};

export const getAllD2ChambersS = async () => {
    const query = `
    SELECT * FROM d2_chamber
    WHERE is_active = true
    ORDER BY d2_chamber_no ASC;
    `;

    const result = await pool.query(query);
    return result.rows;
};
