import pool from "../../db/postgres.js";

export const validateBobbinForD2S = async (bobbin_no, restricted) => {
    // Step 1: Check bobbin exists
    const bobbinResult = await pool.query(
        `SELECT bobbin_no, fid, fiber_type, fiber_color, d2_issue
         FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinResult.rows.length === 0) {
        return { success: false, message: "Bobbin not found." };
    }

    const bobbin = bobbinResult.rows[0];

    // Get temp_grade and final_grade from qc_entry_temp
    const qcTempResult = await pool.query(
        `SELECT temp_grade, final_grade FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    const temp_grade = qcTempResult.rows[0]?.temp_grade || null;
    const final_grade = qcTempResult.rows[0]?.final_grade || null;

    // Step 2: Check d2_issue
    if (bobbin.d2_issue === true) {
        return { success: false, message: "This bobbin is already issued for D2." };
    }

    // Step 3: Restricted vs Not-Restricted
    if (restricted) {
        // Check PV status
        const pvResult = await pool.query(
            `SELECT pv_entry_id FROM pv_entries WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        return {
            success: true,
            data: {
                bobbin_no: bobbin.bobbin_no,
                bobbin_fid: bobbin.fid,
                fiber_type: bobbin.fiber_type,
                fiber_color: bobbin.fiber_color,
                temp_grade,
                final_grade,
                d2_issue: bobbin.d2_issue,
                pv_completed: pvResult.rows.length > 0
            }
        };
    } else {
        // Check temp_grade
        if (temp_grade === 'REW') {
            return { success: false, message: "This bobbin cannot be issued because its temporary grade is REW." };
        }
        if (temp_grade === 'FAIL') {
            return { success: false, message: "This bobbin cannot be issued because its temporary grade is FAIL." };
        }

        return {
            success: true,
            data: {
                bobbin_no: bobbin.bobbin_no,
                bobbin_fid: bobbin.fid,
                fiber_type: bobbin.fiber_type,
                fiber_color: bobbin.fiber_color,
                temp_grade,
                final_grade,
                d2_issue: bobbin.d2_issue,
                pv_completed: null
            }
        };
    }
};

export const submitD2IssueS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { d2_batch_id, start_operator, d2_start_date, d2_start_time,
                chamber, process_hours, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            // Insert into d2_issue
            await client.query(
                `
                INSERT INTO d2_issue (
                    d2_batch_id, start_operator, d2_start_date, d2_start_time,
                    bobbin_fid, bobbin_no, chamber, process_hours, d2_type, logged_in_user
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                `,
                [
                    d2_batch_id,
                    start_operator,
                    d2_start_date,
                    d2_start_time,
                    bobbin.bobbin_fid,
                    bobbin.bobbin_no,
                    chamber,
                    process_hours,
                    bobbin.d2_type,
                    logged_in_user
                ]
            );

            // Update bobbin_entries
            await client.query(
                `UPDATE bobbin_entries SET d2_issue = true, d2_batch_id = $1 WHERE bobbin_no = $2`,
                [d2_batch_id, bobbin.bobbin_no]
            );
        }

        // Mark D2 chamber as occupied
        await client.query(
            `UPDATE d2_chamber SET is_active = false WHERE d2_chamber_no = $1`,
            [chamber]
        );

        await client.query("COMMIT");

        return { success: true, message: "D2 Issue submitted successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
