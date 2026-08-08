import pool from "../../db/postgres.js";

export const getAllRewMachinesS = async () => {
  const query = `SELECT * FROM rew_machine ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
};

export const createRewMachineS = async (payload) => {
  const rew_machine_no = payload.rew_machine_no?.trim();

  if (!rew_machine_no) {
    const error = new Error("rew_machine_no is required");
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate
  const dupCheck = await pool.query(
    `SELECT rew_machine_id FROM rew_machine WHERE LOWER(rew_machine_no) = LOWER($1)`,
    [rew_machine_no]
  );
  if (dupCheck.rows.length > 0) {
    const error = new Error("Machine number already exists");
    error.statusCode = 409;
    throw error;
  }

  const query = `INSERT INTO rew_machine (rew_machine_no) VALUES ($1) RETURNING *`;
  const result = await pool.query(query, [rew_machine_no]);
  return result.rows[0];
};

export const updateRewMachineS = async (id, payload) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (payload.rew_machine_no !== undefined) {
    const trimmed = payload.rew_machine_no.trim();
    if (!trimmed) {
      const error = new Error("rew_machine_no cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    // Check duplicate (exclude current record)
    const dupCheck = await pool.query(
      `SELECT rew_machine_id FROM rew_machine WHERE LOWER(rew_machine_no) = LOWER($1) AND rew_machine_id != $2`,
      [trimmed, id]
    );
    if (dupCheck.rows.length > 0) {
      const error = new Error("Machine number already exists");
      error.statusCode = 409;
      throw error;
    }
    fields.push(`rew_machine_no = $${idx++}`);
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
  const query = `UPDATE rew_machine SET ${fields.join(", ")} WHERE rew_machine_id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const deleteRewMachineS = async (id) => {
  const query = `DELETE FROM rew_machine WHERE rew_machine_id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};
