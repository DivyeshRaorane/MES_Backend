import pool from "../../db/postgres.js";

export const createBobbinColorS = async(payload)=>{
    const {bobbin_color_name} = payload;
console.log("Bobbin color", payload)
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