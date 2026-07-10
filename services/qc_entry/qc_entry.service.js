import pool from "../../db/postgres.js";

// API 1: Fetch bobbin QC data
// First check qc_entry (final) → if exists, return data + block edits
// Then check qc_entry_temp → if exists, return data + allow edits
// Otherwise → not found
export const fetchBobbinQcS = async (bobbin_no) => {
    // Check qc_entry (final record)
    const finalResult = await pool.query(
        `SELECT * FROM qc_entry WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (finalResult.rows.length > 0) {
        return {
            success: true,
            source: "final",
            editable: false,
            data: finalResult.rows[0],
            message: "Final QC has already been completed. No further changes allowed."
        };
    }

    // Check qc_entry_temp
    const tempResult = await pool.query(
        `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (tempResult.rows.length > 0) {
        return {
            success: true,
            source: "temp",
            editable: true,
            data: tempResult.rows[0]
        };
    }

    return { success: false, message: "Bobbin not found." };
};

// API 2: Check process completion
export const checkProcessCompletionS = async (bobbin_no) => {
    const result = await pool.query(
        `SELECT is_pv, is_d2, is_h2 FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return { success: false, message: "Bobbin not found in bobbin_entries." };
    }

    const { is_pv, is_d2, is_h2 } = result.rows[0];
    const is_final_eligible = is_pv === true && is_d2 === true && is_h2 === true;

    const pending = [];
    if (!is_pv) pending.push("PV");
    if (!is_d2) pending.push("D2");
    if (!is_h2) pending.push("H2");

    return {
        success: true,
        data: { is_pv, is_d2, is_h2, is_final_eligible, pending }
    };
};

// API 3: Submit QC
// If final eligible + grade not FAIL/REW → INSERT into qc_entry + UPDATE qc_entry_temp.final_grade
// Otherwise → UPDATE qc_entry_temp with temp_grade
export const submitQcEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { bobbin_no, bobbin_fid, matcode, measurements, grade, logged_in_user } = payload;

        // Block if already in qc_entry (final done)
        const finalCheck = await client.query(
            `SELECT bobbin_no FROM qc_entry WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        if (finalCheck.rows.length > 0) {
            throw new Error("Final QC has already been completed for this bobbin.");
        }

        // Check process completion
        const processResult = await client.query(
            `SELECT is_pv, is_d2, is_h2 FROM bobbin_entries WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        if (processResult.rows.length === 0) {
            throw new Error("Bobbin not found in bobbin_entries.");
        }

        const { is_pv, is_d2, is_h2 } = processResult.rows[0];
        const isFinalEligible = is_pv === true && is_d2 === true && is_h2 === true;
        const isFinal = isFinalEligible && grade !== 'FAIL' && grade !== 'REW';

        // Build measurement columns
        const measurementKeys = Object.keys(measurements);
        const measurementValues = measurementKeys.map(k => measurements[k] === '' ? null : measurements[k]);

        if (isFinal) {
            // INSERT into qc_entry (final)
            const qcKeys = ['bobbin_no', 'bobbin_fid', 'matcode', ...measurementKeys, 'final_grade'];
            const qcValues = [bobbin_no, bobbin_fid, matcode, ...measurementValues, grade];
            const placeholders = qcValues.map((_, i) => `$${i + 1}`).join(',');

            await client.query(
                `INSERT INTO qc_entry (${qcKeys.join(',')}) VALUES (${placeholders})`,
                qcValues
            );

            // Update qc_entry_temp with final_grade
            await client.query(
                `UPDATE qc_entry_temp SET final_grade = $1 WHERE bobbin_no = $2`,
                [grade, bobbin_no]
            );

            // Update bobbin_entries
            await client.query(
                `UPDATE bobbin_entries SET final_grade = $1, temp_grade = $1 WHERE bobbin_no = $2`,
                [grade, bobbin_no]
            );

            await client.query("COMMIT");
            return { success: true, type: "final", message: "Final QC submitted successfully.", grade };

        } else {
            // UPDATE qc_entry_temp (upsert)
            const tempKeys = ['bobbin_no', 'bobbin_fid', 'matcode', ...measurementKeys, 'temp_grade'];
            const tempValues = [bobbin_no, bobbin_fid, matcode, ...measurementValues, grade];
            const placeholders = tempValues.map((_, i) => `$${i + 1}`).join(',');
            const updateSet = tempKeys
                .filter(k => k !== 'bobbin_no')
                .map(k => `${k} = EXCLUDED.${k}`)
                .join(',');

            await client.query(
                `INSERT INTO qc_entry_temp (${tempKeys.join(',')}) VALUES (${placeholders})
                 ON CONFLICT (bobbin_no) DO UPDATE SET ${updateSet}`,
                tempValues
            );

            // Update bobbin_entries temp_grade
            await client.query(
                `UPDATE bobbin_entries SET temp_grade = $1 WHERE bobbin_no = $2`,
                [grade, bobbin_no]
            );

            await client.query("COMMIT");

            const pending = [];
            if (!is_pv) pending.push("PV");
            if (!is_d2) pending.push("D2");
            if (!is_h2) pending.push("H2");

            return { success: true, type: "temp", message: "Temporary QC saved successfully.", grade, pending };
        }

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
