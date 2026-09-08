import pool from "../../db/postgres.js";

export const createFiberColorS = async (payload) => {
  const { color } = payload;

  const query = `
    INSERT INTO fiber_color (color)
    VALUES ($1)
    RETURNING *;
  `;

  const result = await pool.query(query, [color]);
  return result.rows[0];
};

export const getFiberColorS = async (is_active = null) => {
  let query = `SELECT * FROM fiber_color`;
  const params = [];

  if (is_active !== null && is_active !== undefined) {
    query += ` WHERE is_active = $1`;
    params.push(is_active);
  }

  query += ` ORDER BY fiber_color_id ASC`;

  const result = await pool.query(query, params);
  return result.rows;
};

export const getFiberColorByIdS = async (fiber_color_id) => {
  const query = `SELECT * FROM fiber_color WHERE fiber_color_id = $1`;
  const result = await pool.query(query, [fiber_color_id]);
  return result.rows[0];
};

export const updateFiberColorS = async (fiber_color_id, payload) => {
  const { color, is_active } = payload;

  const query = `
    UPDATE fiber_color
    SET color = $1, is_active = $2
    WHERE fiber_color_id = $3
    RETURNING *;
  `;

  const result = await pool.query(query, [color, is_active, fiber_color_id]);
  return result.rows[0];
};
