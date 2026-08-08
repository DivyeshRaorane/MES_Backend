import pool from "../../db/postgres.js";

export const getAllColorMachinesS = async () => {
  const query = `SELECT * FROM color_machine ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
};

export const createColorMachineS = async (payload) => {
  const color_machine_no = payload.color_machine_no?.trim();

  if (!color_machine_no) {
    const error = new Error("color_machine_no is required");
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate
  const dupCheck = await pool.query(
    `SELECT color_machine_id FROM color_machine WHERE LOWER(color_machine_no) = LOWER($1)`,
    [color_machine_no]
  );
  if (dupCheck.rows.length > 0) {
    const error = new Error("Machine number already exists");
    error.statusCode = 409;
    throw error;
  }

  const query = `INSERT INTO color_machine (color_machine_no) VALUES ($1) RETURNING *`;
  const result = await pool.query(query, [color_machine_no]);
  return result.rows[0];
};

export const updateColorMachineS = async (id, payload) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (payload.color_machine_no !== undefined) {
    const trimmed = payload.color_machine_no.trim();
    if (!trimmed) {
      const error = new Error("color_machine_no cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    // Check duplicate (exclude current record)
    const dupCheck = await pool.query(
      `SELECT color_machine_id FROM color_machine WHERE LOWER(color_machine_no) = LOWER($1) AND color_machine_id != $2`,
      [trimmed, id]
    );
    if (dupCheck.rows.length > 0) {
      const error = new Error("Machine number already exists");
      error.statusCode = 409;
      throw error;
    }
    fields.push(`color_machine_no = $${idx++}`);
    values.push(trimmed);
  }

  if (payload.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(payload.is_active);
  }

  if (fields.length === 0) {
    const error = new Error("No fields to update");
    error.statusCode = 400;
    throw error;
  }

  values.push(id);
  const query = `UPDATE color_machine SET ${fields.join(", ")} WHERE color_machine_id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const deleteColorMachineS = async (id) => {
  const query = `DELETE FROM color_machine WHERE color_machine_id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};
