import pool from "../../db/postgres.js";

// GET all config entries
export const getAllConfigsS = async () => {
    const result = await pool.query(
        `SELECT * FROM app_config ORDER BY id DESC`
    );
    return result.rows;
};

// CREATE config entry
export const createConfigS = async (data) => {
    const { config_key, config_value, description, updated_by } = data;

    // Check for duplicate config_key
    const existing = await pool.query(
        `SELECT id FROM app_config WHERE config_key = $1`,
        [config_key]
    );

    if (existing.rows.length > 0) {
        throw new Error("Config key already exists");
    }

    const result = await pool.query(
        `INSERT INTO app_config (config_key, config_value, description, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [config_key, config_value, description, updated_by]
    );

    return result.rows[0];
};

// UPDATE config entry (value and description only)
export const updateConfigS = async (id, data) => {
    const { config_value, description, updated_by } = data;

    const result = await pool.query(
        `UPDATE app_config SET config_value = $1, description = $2, updated_by = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [config_value, description, updated_by, id]
    );

    if (result.rows.length === 0) {
        throw new Error("Config entry not found");
    }

    return result.rows[0];
};

// TOGGLE disable status
export const toggleConfigStatusS = async (id, data) => {
    const { disable, updated_by } = data;

    const result = await pool.query(
        `UPDATE app_config SET disable = $1, updated_by = $2, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [disable, updated_by, id]
    );

    if (result.rows.length === 0) {
        throw new Error("Config entry not found");
    }

    return result.rows[0];
};
