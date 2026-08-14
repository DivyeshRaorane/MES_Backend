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
        SELECT d2_batch_id, d2_start_date, d2_start_time, COUNT(*) as total_bobbins
        FROM d2_issue
        WHERE chamber = $1
        AND d2_end_date IS NULL
        AND d2_end_time IS NULL
        GROUP BY d2_batch_id, d2_start_date, d2_start_time
        LIMIT 1;
    `;
    const result = await pool.query(query, [chamber_no]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};

export const completeReceivingS = async (payload) => {
    const client = await pool.connect();

    const MINIMUM_HOURS = 18; // Minimum hours before receiving is allowed

    try {
        await client.query("BEGIN");

        const { d2_batch_id, d2_chamber, d2_end_date, d2_end_time,
                process_hours, end_operator, logged_in_user } = payload;

        // Validate batch exists and is still running
        const batchCheck = await client.query(
            `SELECT d2_batch_id, d2_start_date, d2_start_time FROM d2_issue WHERE d2_batch_id = $1 AND d2_end_date IS NULL LIMIT 1`,
            [d2_batch_id]
        );

        if (batchCheck.rows.length === 0) {
            throw new Error("D2 batch not found or already completed.");
        }

        // Validate minimum hours elapsed since start
        const { d2_start_date, d2_start_time } = batchCheck.rows[0];
        const startDateTime = new Date(`${d2_start_date}T${d2_start_time}`);
        const now = new Date();
        const elapsedHours = (now - startDateTime) / (1000 * 60 * 60);

        if (elapsedHours < MINIMUM_HOURS) {
            throw new Error(`Cannot receive yet. Minimum ${MINIMUM_HOURS}h required. Only ${elapsedHours.toFixed(1)}h elapsed since start.`);
        }

        // Step 1: Update all d2_issue records for this batch
        await client.query(
            `
            UPDATE d2_issue
            SET d2_end_date = $1,
                d2_end_time = $2,
                process_hours = $3,
                end_operator = $4,
                logged_in_user = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE d2_batch_id = $6
            AND d2_end_date IS NULL
            AND d2_end_time IS NULL
            `,
            [d2_end_date, d2_end_time, process_hours, end_operator, logged_in_user, d2_batch_id]
        );

        // Step 2: Mark all bobbins in this batch as D2 completed
        await client.query(
            `UPDATE bobbin_entries SET is_d2 = true WHERE d2_batch_id = $1`,
            [d2_batch_id]
        );

        // Step 3: Set chamber back to active
        await client.query(
            `UPDATE d2_chamber SET is_active = true WHERE d2_chamber_no = $1`,
            [d2_chamber]
        );

        await client.query("COMMIT");

        return { success: true, message: "D2 Receiving completed successfully. All bobbins marked as D2 completed." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
