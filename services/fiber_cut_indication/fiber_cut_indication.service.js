import pool from "../../db/postgres.js";

// Get all active (non-disabled) indications
export const getAllFiberCutIndicationsS = async () => {
    const result = await pool.query(
        `SELECT * FROM fiber_cut_indication WHERE disable = false ORDER BY indication_name`
    );
    return result.rows;
};

// Get a single indication by ID
export const getFiberCutIndicationByIdS = async (indication_fiber_cut_id) => {
    const result = await pool.query(
        `SELECT * FROM fiber_cut_indication WHERE indication_fiber_cut_id = $1`,
        [indication_fiber_cut_id]
    );
    return result.rows[0];
};

// Create a new indication
export const createFiberCutIndicationS = async (data) => {
    const indication_name = data.indication_name?.trim();

    if (!indication_name) {
        throw new Error("indication_name is required");
    }

    // Case-insensitive uniqueness check
    const existing = await pool.query(
        `SELECT * FROM fiber_cut_indication WHERE LOWER(indication_name) = LOWER($1)`,
        [indication_name]
    );

    if (existing.rows.length > 0) {
        return { duplicate: true, message: "Indication name already exists" };
    }

    const result = await pool.query(
        `INSERT INTO fiber_cut_indication (indication_name) VALUES ($1) RETURNING *`,
        [indication_name]
    );
    return result.rows[0];
};

// Update an indication (name and/or disable)
export const updateFiberCutIndicationS = async (indication_fiber_cut_id, data) => {
    const indication_name = data.indication_name?.trim();
    const disable = data.disable;

    if (indication_name) {
        // Case-insensitive uniqueness check (exclude current ID)
        const existing = await pool.query(
            `SELECT * FROM fiber_cut_indication WHERE LOWER(indication_name) = LOWER($1) AND indication_fiber_cut_id != $2`,
            [indication_name, indication_fiber_cut_id]
        );

        if (existing.rows.length > 0) {
            return { duplicate: true, message: "Indication name already exists" };
        }
    }

    const result = await pool.query(
        `UPDATE fiber_cut_indication SET indication_name = COALESCE($1, indication_name), disable = COALESCE($2, disable) WHERE indication_fiber_cut_id = $3 RETURNING *`,
        [indication_name || null, disable !== undefined ? disable : null, indication_fiber_cut_id]
    );
    return result.rows[0];
};

// Soft delete (set disable = true)
export const deleteFiberCutIndicationS = async (indication_fiber_cut_id) => {
    const result = await pool.query(
        `UPDATE fiber_cut_indication SET disable = true WHERE indication_fiber_cut_id = $1 RETURNING *`,
        [indication_fiber_cut_id]
    );
    return result.rows[0];
};
