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

        // Step 3: Update final_grade from temp_grade for all bobbins in this batch
        const bobbinsResult = await client.query(
            `SELECT bobbin_no FROM bobbin_entries WHERE d2_batch_id = $1`,
            [d2_batch_id]
        );

        for (const row of bobbinsResult.rows) {
            const { bobbin_no } = row;

            // Get temp_grade from qc_entry_temp
            const qcTempResult = await client.query(
                `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin_no]
            );

            if (qcTempResult.rows.length === 0) continue;

            const tempRow = qcTempResult.rows[0];
            const finalGrade = tempRow.temp_grade;

            if (!finalGrade) continue;

            // Update final_grade in qc_entry_temp
            await client.query(
                `UPDATE qc_entry_temp SET final_grade = $2 WHERE bobbin_no = $1`,
                [bobbin_no, finalGrade]
            );

            // Update final_grade in bobbin_entries
            await client.query(
                `UPDATE bobbin_entries SET final_grade = $2 WHERE bobbin_no = $1`,
                [bobbin_no, finalGrade]
            );

            // Copy full record from qc_entry_temp into qc_entry
            // Re-fetch after final_grade update
            const updatedTempRow = (await client.query(
                `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin_no]
            )).rows[0];

            const excludeFields = ['created_at', 'updated_at', 'logged_in_user'];
            const columns = Object.keys(updatedTempRow).filter(k => !excludeFields.includes(k));
            const values = columns.map(k => updatedTempRow[k] === '' ? null : updatedTempRow[k]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
            const updateSet = columns.filter(k => k !== 'bobbin_no').map(k => `${k} = EXCLUDED.${k}`).join(',');

            await client.query(
                `INSERT INTO qc_entry (${columns.join(',')}) VALUES (${placeholders})
                 ON CONFLICT (bobbin_no) DO UPDATE SET ${updateSet}`,
                values
            );
        }

        // Step 4: Set chamber back to active
        await client.query(
            `UPDATE d2_chamber SET is_active = true WHERE d2_chamber_no = $1`,
            [d2_chamber]
        );

        await client.query("COMMIT");

        return { success: true, message: "D2 Receiving completed successfully. All bobbins marked as D2 completed and final grades updated." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
