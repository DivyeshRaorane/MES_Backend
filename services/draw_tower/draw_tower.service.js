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

export const getTowerS = async (is_active = null) => {
  let query = `SELECT * FROM draw_tower`;
  const params = [];

  if (is_active !== null && is_active !== undefined) {
    query += ` WHERE is_active = $1`;
    params.push(is_active);
  }

  const result = await pool.query(query, params);
  return result.rows;
};