import pool from "../../db/postgres.js";

export const getPreformVendorS = async () => {
  const query = `SELECT * FROM preform_vendor ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
};

export const createPreformVendorS = async (payload) => {
  const { vendor_code, vendor_name, vendor_initial } = payload;

  // Check uniqueness of vendor_name and vendor_initial
  const checkQuery = `
    SELECT * FROM preform_vendor 
    WHERE vendor_name = $1 OR vendor_initial = $2
  `;
  const existing = await pool.query(checkQuery, [vendor_name, vendor_initial]);

  if (existing.rows.length > 0) {
    throw new Error("Vendor name or initial already exists");
  }

  const query = `
    INSERT INTO preform_vendor (vendor_code, vendor_name, vendor_initial)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const result = await pool.query(query, [vendor_code || null, vendor_name, vendor_initial]);
  return result.rows[0];
};

export const updatePreformVendorS = async (preform_vendor_id, payload) => {
  const { vendor_code, vendor_name, vendor_initial, is_disable } = payload;

  // Check uniqueness excluding current record
  const checkQuery = `
    SELECT * FROM preform_vendor 
    WHERE (vendor_name = $1 OR vendor_initial = $2) AND preform_vendor_id != $3
  `;
  const existing = await pool.query(checkQuery, [vendor_name, vendor_initial, preform_vendor_id]);

  if (existing.rows.length > 0) {
    throw new Error("Vendor name or initial already exists");
  }

  const query = `
    UPDATE preform_vendor
    SET vendor_code = $1, vendor_name = $2, vendor_initial = $3, is_disable = $4
    WHERE preform_vendor_id = $5
    RETURNING *;
  `;

  const result = await pool.query(query, [vendor_code || null, vendor_name, vendor_initial, is_disable, preform_vendor_id]);
  return result.rows[0];
};
