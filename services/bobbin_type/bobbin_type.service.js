import pool from "../../db/postgres.js";

export const createBobbinTypeS = async(payload)=>{
    const {bobbin_type_name} = payload;

    const query = `
    INSERT INTO bobbin_type (bobbin_type_name)
    VALUES ($1)
    RETURNING *;
    `;

    const result = await pool.query(query,[bobbin_type_name]);
    return result.rows[0];
};

export const getBobbinTypeS = async (is_disable = null) => {
  let query = `SELECT * FROM bobbin_type`;
  const params = [];

  if (is_disable !== null && is_disable !== undefined) {
    query += ` WHERE is_disable = $1`;
    params.push(is_disable);
  }

  const result = await pool.query(query, params);
  return result.rows;
};