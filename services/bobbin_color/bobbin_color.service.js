import pool from "../../db/postgres.js";

export const createBobbinColorS = async(payload)=>{
    const {bobbin_color_name} = payload;

    const query = `
    INSERT INTO bobbin_color (bobbin_color_name)
    VALUES ($1)
    RETURNING *;
    `;

    const result = await pool.query(query,[bobbin_color_name]);
    return result.rows[0];
};

export const getBobbinColorS = async (is_disable = null) => {
  let query = `SELECT * FROM bobbin_color`;
  const params = [];

  if (is_disable !== null && is_disable !== undefined) {
    query += ` WHERE is_disable = $1`;
    params.push(is_disable);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

export const updateBobbinColorS = async (bobbin_color_id, payload) => {
  const { bobbin_color_name, is_disable } = payload;

  const query = `
    UPDATE bobbin_color
    SET bobbin_color_name = $1, is_disable = $2
    WHERE bobbin_color_id = $3
    RETURNING *;
  `;

  const result = await pool.query(query, [bobbin_color_name, is_disable, bobbin_color_id]);
  return result.rows[0];
};