import pool from "../../db/postgres.js";

export const getChambersInUseS = async () => {
    const query = `
        SELECT * FROM d2_chamber
        WHERE is_active = false
        ORDER BY d2_chamber_no ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

export const getRunningBatchS = async (chamber_no) => {
    const query = `
        SELECT d2_batch_id, COUNT(*) as total_bobbins
        FROM d2_issue
        WHERE chamber = $1
        AND d2_end_date IS NULL
        AND d2_end_time IS NULL
        GROUP BY d2_batch_id
        LIMIT 1;
    `;
    const result = await pool.query(query, [chamber_no]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};

export const submitGasEntryS = async (payload) => {
    const { d2_batch_id, d2_chamber, gas_concentration, fresh_gas, used_gas,
            n2_gas, tank_pressure, gas_issue_date, gas_issue_time,
            cycle_time_min, shift, d2_gas_operator, total_bobbins, logged_in_user } = payload;

    // Validate batch exists
    const batchCheck = await pool.query(
        `SELECT d2_batch_id FROM d2_issue WHERE d2_batch_id = $1 LIMIT 1`,
        [d2_batch_id]
    );

    if (batchCheck.rows.length === 0) {
        throw new Error("D2 batch not found.");
    }

    // Check if gas entry already exists for this batch
    const gasCheck = await pool.query(
        `SELECT d2_gas_id FROM d2_gas_entry WHERE d2_batch_id = $1 LIMIT 1`,
        [d2_batch_id]
    );

    if (gasCheck.rows.length > 0) {
        throw new Error("Gas entry already exists for this batch.");
    }

    const query = `
        INSERT INTO d2_gas_entry (
            d2_batch_id, d2_chamber, gas_concentration, fresh_gas, used_gas, n2_gas,
            tank_pressure, gas_issue_date, gas_issue_time, cycle_time_min, shift,
            d2_gas_operator, total_bobbins, logged_in_user
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *;
    `;

    const result = await pool.query(query, [
        d2_batch_id, d2_chamber, gas_concentration, fresh_gas, used_gas, n2_gas,
        tank_pressure, gas_issue_date, gas_issue_time, cycle_time_min, shift,
        d2_gas_operator, total_bobbins, logged_in_user
    ]);

    return result.rows[0];
};
