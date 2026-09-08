import pool from "../../db/postgres.js";

// CREATE
export const createColMaterialCodeS = async (payload) => {
  const { product, color, material_code, is_active } = payload;

  const query = `
    INSERT INTO col_material_code (product, color, material_code, is_active)
    VALUES ($1, $2, $3, COALESCE($4, true))
    RETURNING *;
  `;

  const result = await pool.query(query, [product, color, material_code, is_active]);
  return result.rows[0];
};

// LIST (optionally filter by is_active)
export const getColMaterialCodeS = async (is_active = null) => {
  let query = `SELECT * FROM col_material_code`;
  const params = [];

  if (is_active !== null && is_active !== undefined) {
    query += ` WHERE is_active = $1`;
    params.push(is_active);
  }

  query += ` ORDER BY col_material_code_id DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

// VIEW (single record by id)
export const getColMaterialCodeByIdS = async (col_material_code_id) => {
  const query = `SELECT * FROM col_material_code WHERE col_material_code_id = $1`;
  const result = await pool.query(query, [col_material_code_id]);
  return result.rows[0];
};

// UPDATE / EDIT
export const updateColMaterialCodeS = async (col_material_code_id, payload) => {
  const { product, color, material_code, is_active } = payload;

  const query = `
    UPDATE col_material_code
    SET product = COALESCE($1, product),
        color = COALESCE($2, color),
        material_code = COALESCE($3, material_code),
        is_active = COALESCE($4, is_active)
    WHERE col_material_code_id = $5
    RETURNING *;
  `;

  const result = await pool.query(query, [
    product,
    color,
    material_code,
    is_active,
    col_material_code_id,
  ]);
  return result.rows[0];
};
