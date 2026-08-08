import pool from "../../db/postgres.js";

export const getAllPTMachinesS = async () => {
  const query = `SELECT * FROM pt_machine ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
};

export const createPTMachineAdminS = async (payload) => {
  const pt_machine_no = payload.pt_machine_no?.trim();

  if (!pt_machine_no) {
    const error = new Error("pt_machine_no is required");
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate
  const dupCheck = await pool.query(
    `SELECT pt_machine_id FROM pt_machine WHERE LOWER(pt_machine_no) = LOWER($1)`,
    [pt_machine_no]
  );
  if (dupCheck.rows.length > 0) {
    const error = new Error("Machine number already exists");
    error.statusCode = 409;
    throw error;
  }

  const query = `INSERT INTO pt_machine (pt_machine_no) VALUES ($1) RETURNING *`;
  const result = await pool.query(query, [pt_machine_no]);
  return result.rows[0];
};

export const updatePTMachineS = async (id, payload) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (payload.pt_machine_no !== undefined) {
    const trimmed = payload.pt_machine_no.trim();
    if (!trimmed) {
      const error = new Error("pt_machine_no cannot be empty");
      error.statusCode = 400;
      throw error;
    }
    // Check duplicate (exclude current record)
    const dupCheck = await pool.query(
      `SELECT pt_machine_id FROM pt_machine WHERE LOWER(pt_machine_no) = LOWER($1) AND pt_machine_id != $2`,
      [trimmed, id]
    );
    if (dupCheck.rows.length > 0) {
      const error = new Error("Machine number already exists");
      error.statusCode = 409;
      throw error;
    }
    fields.push(`pt_machine_no = $${idx++}`);
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
  const query = `UPDATE pt_machine SET ${fields.join(", ")} WHERE pt_machine_id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

export const deletePTMachineS = async (id) => {
  const query = `DELETE FROM pt_machine WHERE pt_machine_id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    const error = new Error("Machine not found");
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};
