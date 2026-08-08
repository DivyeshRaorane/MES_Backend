import pool from "../../db/postgres.js";

export const getAllPTUsersS = async () => {
  const query = `SELECT * FROM pt_users ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
};

export const createPTUserS = async (payload) => {
  const emp_id = payload.emp_id?.trim();
  const pt_user_name = payload.pt_user_name?.trim();

  if (!emp_id || !pt_user_name) {
    const error = new Error("emp_id and pt_user_name are required");
    error.statusCode = 400;
    throw error;
  }

  const query = `INSERT INTO pt_users (emp_id, pt_user_name) VALUES ($1, $2) RETURNING *`;
  const result = await pool.query(query, [emp_id, pt_user_name]);
  return result.rows[0];
};

export const updatePTUserS = async (id, payload) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (payload.emp_id !== undefined) {
    const trimmed = payload.emp_id.trim();
    if (!trimmed) {
      const error = new Error("emp_id cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    fields.push(`emp_id = $${idx++}`);
    values.push(trimmed);
  }

  if (payload.pt_user_name !== undefined) {
    const trimmed = payload.pt_user_name.trim();
    if (!trimmed) {
      const error = new Error("pt_user_name cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    fields.push(`pt_user_name = $${idx++}`);
    values.push(trimmed);
  }

  if (fields.length === 0) {
    const error = new Error("No fields to update");
    error.statusCode = 400;
    throw error;
  }

  values.push(id);
  const query = `UPDATE pt_users SET ${fields.join(", ")} WHERE pt_user_id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    const error = new Error("PT User not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const deletePTUserS = async (id) => {
  const query = `DELETE FROM pt_users WHERE pt_user_id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    const error = new Error("PT User not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};
