import pool from "../../db/postgres.js";

// API 1: Fetch bobbin QC data
export const fetchBobbinQcS = async (bobbin_no) => {
    // Step 1: Check qc_entry FIRST
    const qcEntry = await pool.query(`SELECT * FROM qc_entry WHERE bobbin_no = $1`, [bobbin_no]);
    if (qcEntry.rows[0]) {
        return { success: true, source: "final", editable: false, data: qcEntry.rows[0] };
    }

    // Step 2: Check qc_entry_temp
    const qcTemp = await pool.query(`SELECT * FROM qc_entry_temp WHERE bobbin_no = $1`, [bobbin_no]);
    if (!qcTemp.rows[0]) {
        return { success: false, message: "Record not found." };
    }

    // Step 3: Return editable data
    return { success: true, source: "temp", editable: true, data: qcTemp.rows[0] };
};

// API 2: Check process completion
export const checkProcessCompletionS = async (bobbin_no) => {
    const result = await pool.query(
        `SELECT is_pv, is_d2, is_h2_after FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return { success: false, message: "Bobbin not found in bobbin_entries." };
    }

    const { is_pv, is_d2 , is_h2_after} = result.rows[0];
    const is_final_eligible = is_pv === true && is_d2 === true && is_h2_after === true;

    const pending = [];
    if (!is_pv) pending.push("PV");
    if (!is_d2) pending.push("D2");
    if (!is_h2_after) pending.push("H2")

    return { success: true, data: { is_pv, is_d2,is_h2_after, is_final_eligible, pending } };
};

// API 3: Submit QC — action-based logic
export const submitQcEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { bobbin_no, grade, action, remark } = payload;

        // Block if already in qc_entry (finalized)
        const finalCheck = await client.query(
            `SELECT bobbin_no FROM qc_entry WHERE bobbin_no = $1`,
            [bobbin_no]
        );
        if (finalCheck.rows.length > 0) {
            throw new Error("Final QC has already been completed for this bobbin.");
        }

        // ═══════════════════════════════════════════
        // ACTION: temp_grade (normal grade — only update temp)
        // ═══════════════════════════════════════════
        if (action === 'temp_grade') {
            await client.query(
                `UPDATE qc_entry_temp SET temp_grade = $2 WHERE bobbin_no = $1`,
                [bobbin_no, grade]
            );

            await client.query(
                `UPDATE bobbin_entries SET temp_grade = $2 WHERE bobbin_no = $1`,
                [bobbin_no, grade]
            );

            await client.query("COMMIT");
            return { success: true, type: "temp", message: "Temp Grade saved.", grade };
        }

        // ═══════════════════════════════════════════
        // ACTION: immediate_final (FAIL or REW — skip validation)
        // ═══════════════════════════════════════════
        if (action === 'immediate_final') {
            // Update qc_entry_temp
            await client.query(
                `UPDATE qc_entry_temp SET temp_grade = $2, final_grade = $2, remark = COALESCE($3, remark) WHERE bobbin_no = $1`,
                [bobbin_no, grade, remark || null]
            );

            // Copy full record from qc_entry_temp into qc_entry
            const tempRow = (await client.query(`SELECT * FROM qc_entry_temp WHERE bobbin_no = $1`, [bobbin_no])).rows[0];

            if (!tempRow) {
                throw new Error("QC temp data not found.");
            }

            const excludeFields = ['created_at', 'updated_at', 'logged_in_user'];
            const columns = Object.keys(tempRow).filter(k => !excludeFields.includes(k));
            const values = columns.map(k => tempRow[k] === '' ? null : tempRow[k]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
            const updateSet = columns.filter(k => k !== 'bobbin_no').map(k => `${k} = EXCLUDED.${k}`).join(',');

            await client.query(
                `INSERT INTO qc_entry (${columns.join(',')}) VALUES (${placeholders})
                 ON CONFLICT (bobbin_no) DO UPDATE SET ${updateSet}`,
                values
            );

            // Update bobbin_entries
            await client.query(
                `UPDATE bobbin_entries SET temp_grade = $2, final_grade = $2 WHERE bobbin_no = $1`,
                [bobbin_no, grade]
            );

            await client.query("COMMIT");
            return { success: true, type: "final", message: `Bobbin marked as ${grade}.`, grade };
        }

        // ═══════════════════════════════════════════
        // ACTION: final_grade (promote temp_grade to final)
        // ═══════════════════════════════════════════
        if (action === 'final_grade') {
            // Get temp_grade from qc_entry_temp
            const tempResult = await client.query(
                `SELECT temp_grade FROM qc_entry_temp WHERE bobbin_no = $1`,
                [bobbin_no]
            );

            if (tempResult.rows.length === 0) {
                throw new Error("QC temp data not found.");
            }

            const finalGrade = grade || tempResult.rows[0].temp_grade;

            // Update qc_entry_temp with final_grade
            await client.query(
                `UPDATE qc_entry_temp SET final_grade = $2 WHERE bobbin_no = $1`,
                [bobbin_no, finalGrade]
            );

            // Copy full record from qc_entry_temp into qc_entry
            const tempRow = (await client.query(`SELECT * FROM qc_entry_temp WHERE bobbin_no = $1`, [bobbin_no])).rows[0];

            const excludeFields = ['created_at', 'updated_at', 'logged_in_user'];
            const columns = Object.keys(tempRow).filter(k => !excludeFields.includes(k));
            const values = columns.map(k => tempRow[k] === '' ? null : tempRow[k]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
            const updateSet = columns.filter(k => k !== 'bobbin_no').map(k => `${k} = EXCLUDED.${k}`).join(',');

            await client.query(
                `INSERT INTO qc_entry (${columns.join(',')}) VALUES (${placeholders})
                 ON CONFLICT (bobbin_no) DO UPDATE SET ${updateSet}`,
                values
            );

            // Update bobbin_entries
            await client.query(
                `UPDATE bobbin_entries SET final_grade = $2 WHERE bobbin_no = $1`,
                [bobbin_no, finalGrade]
            );

            await client.query("COMMIT");
            return { success: true, type: "final", message: `Final QC submitted! Grade: ${finalGrade}`, grade: finalGrade };
        }

        throw new Error("Invalid action. Must be 'temp_grade', 'immediate_final', or 'final_grade'.");

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
