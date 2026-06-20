import pool from "../../db/postgres.js";

export const createTowerS = async(payload)=>{
    const {tower_no} = payload;

    const query = `
    INSERT INTO draw_tower (tower_no)
    VALUES ($1)
    RETURNING *;
    `;

    const result = await pool.query(query,[tower_no]);
    return result.rows[0];
};

export const getTowerS = async(is_active)=>{
    
    const query = `
    SELECT * FROM draw_tower
    WHERE is_active = $1;
    `;

    const result = await pool.query(query,[is_active]);

    return result.rows
    
}