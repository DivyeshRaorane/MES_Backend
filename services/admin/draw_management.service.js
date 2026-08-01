import pool from "../../db/postgres.js";

// --- Draw Users ---
export const createDrawUserAdminS = async (data) => {
    const { emp_id, draw_user_name } = data;
    const result = await pool.query(
        `INSERT INTO draw_users (emp_id, draw_user_name) VALUES ($1, $2) RETURNING *`,
        [emp_id, draw_user_name]
    );
    return result.rows[0];
};

export const updateDrawUserAdminS = async (draw_user_id, data) => {
    const { emp_id, draw_user_name, is_active } = data;
    const result = await pool.query(
        `UPDATE draw_users SET emp_id = $1, draw_user_name = $2, is_active = $3 WHERE draw_user_id = $4 RETURNING *`,
        [emp_id, draw_user_name, is_active, draw_user_id]
    );
    return result.rows[0];
};

// --- Draw Towers ---
export const getAllDrawTowersS = async () => {
    const result = await pool.query(`SELECT * FROM draw_tower ORDER BY tower_no`);
    return result.rows;
};

export const createDrawTowerS = async (data) => {
    const { tower_no, furnace_count } = data;
    const result = await pool.query(
        `INSERT INTO draw_tower (tower_no, furnace_count) VALUES ($1, $2) RETURNING *`,
        [tower_no, furnace_count || 0]
    );
    return result.rows[0];
};

export const updateDrawTowerS = async (tower_id, data) => {
    const { tower_no, furnace_count, disable } = data;

    // If trying to disable, check if tower is currently allocated (is_active = false means allocated)
    if (disable === true) {
        const check = await pool.query(
            `SELECT is_active FROM draw_tower WHERE tower_id = $1`,
            [tower_id]
        );

        if (check.rows.length > 0 && check.rows[0].is_active === false) {
            throw new Error("This tower is currently allocated. Please deallocate first before disabling.");
        }

        // Disable tower + set is_active = false
        const result = await pool.query(
            `UPDATE draw_tower SET tower_no = $1, furnace_count = $2, disable = true, is_active = false WHERE tower_id = $3 RETURNING *`,
            [tower_no, furnace_count, tower_id]
        );
        return result.rows[0];
    }

    // Normal update (or re-enable: disable = false, restore is_active = true)
    if (disable === false) {
        const result = await pool.query(
            `UPDATE draw_tower SET tower_no = $1, furnace_count = $2, disable = false, is_active = true WHERE tower_id = $3 RETURNING *`,
            [tower_no, furnace_count, tower_id]
        );
        return result.rows[0];
    }

    // Update without changing disable/is_active
    const result = await pool.query(
        `UPDATE draw_tower SET tower_no = $1, furnace_count = $2 WHERE tower_id = $3 RETURNING *`,
        [tower_no, furnace_count, tower_id]
    );
    return result.rows[0];
};

// --- Fiber Cut Reasons ---
export const getAllFiberCutReasonsS = async () => {
    const result = await pool.query(
        `SELECT r.*, i.indication_name
         FROM d_fiber_cut_reasons r
         LEFT JOIN fiber_cut_indication i ON r.indication_fiber_cut_id = i.indication_fiber_cut_id
         ORDER BY r.dfcr_id`
    );
    return result.rows;
};

export const createFiberCutReasonS = async (data) => {
    const dfcr_name = data.dfcr_name?.trim();
    const { indication_fiber_cut_id } = data;

    if (!dfcr_name) {
        throw new Error("dfcr_name is required");
    }
    if (!indication_fiber_cut_id) {
        throw new Error("indication_fiber_cut_id is required");
    }

    // Check indication exists
    const indicationCheck = await pool.query(
        `SELECT * FROM fiber_cut_indication WHERE indication_fiber_cut_id = $1`,
        [indication_fiber_cut_id]
    );
    if (indicationCheck.rows.length === 0) {
        throw new Error("Invalid indication_fiber_cut_id");
    }

    // Unique check: no duplicate dfcr_name under same indication_fiber_cut_id (case-insensitive)
    const existing = await pool.query(
        `SELECT * FROM d_fiber_cut_reasons WHERE LOWER(dfcr_name) = LOWER($1) AND indication_fiber_cut_id = $2`,
        [dfcr_name, indication_fiber_cut_id]
    );
    if (existing.rows.length > 0) {
        return { duplicate: true, message: "Reason name already exists for this indication" };
    }

    const result = await pool.query(
        `INSERT INTO d_fiber_cut_reasons (dfcr_name, indication_fiber_cut_id) VALUES ($1, $2) RETURNING *`,
        [dfcr_name, indication_fiber_cut_id]
    );
    return result.rows[0];
};

export const updateFiberCutReasonS = async (dfcr_id, data) => {
    const dfcr_name = data.dfcr_name?.trim();
    const { disable, indication_fiber_cut_id } = data;

    if (dfcr_name && indication_fiber_cut_id) {
        // Unique check excluding current ID
        const existing = await pool.query(
            `SELECT * FROM d_fiber_cut_reasons WHERE LOWER(dfcr_name) = LOWER($1) AND indication_fiber_cut_id = $2 AND dfcr_id != $3`,
            [dfcr_name, indication_fiber_cut_id, dfcr_id]
        );
        if (existing.rows.length > 0) {
            return { duplicate: true, message: "Reason name already exists for this indication" };
        }
    }

    const result = await pool.query(
        `UPDATE d_fiber_cut_reasons SET dfcr_name = COALESCE($1, dfcr_name), disable = COALESCE($2, disable), indication_fiber_cut_id = COALESCE($3, indication_fiber_cut_id) WHERE dfcr_id = $4 RETURNING *`,
        [dfcr_name || null, disable !== undefined ? disable : null, indication_fiber_cut_id || null, dfcr_id]
    );
    return result.rows[0];
};

// --- Winding Observations ---
export const getAllWindingObsS = async () => {
    const result = await pool.query(`SELECT * FROM winding_observation ORDER BY wind_obs_id`);
    return result.rows;
};

export const createWindingObsS = async (data) => {
    const { w_o_name } = data;
    const result = await pool.query(
        `INSERT INTO winding_observation (w_o_name) VALUES ($1) RETURNING *`,
        [w_o_name]
    );
    return result.rows[0];
};

export const updateWindingObsS = async (wind_obs_id, data) => {
    const { w_o_name, disable } = data;
    const result = await pool.query(
        `UPDATE winding_observation SET w_o_name = $1, disable = $2 WHERE wind_obs_id = $3 RETURNING *`,
        [w_o_name, disable, wind_obs_id]
    );
    return result.rows[0];
};
