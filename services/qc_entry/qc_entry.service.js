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

// Update missing QC values in qc_entry_temp
const ALLOWED_QC_COLUMNS = [
    'avg_lsa_atn_1310','avg_lsa_atn_1550','avg_lsa_atn_1625','avg_lsa_atn_1383',
    'max_lsa_atn_1310','max_lsa_atn_1550','max_lsa_atn_1625','max_lsa_atn_1383',
    'min_lsa_atn_1310','min_lsa_atn_1550','min_lsa_atn_1625','min_lsa_atn_1383',
    'atn_1310_top','atn_1550_top','atn_1625_top','atn_1383_top',
    'atn_1310_bottom','atn_1550_bottom','atn_1625_bottom','atn_1383_bottom',
    'max_atn_1310_top','max_atn_1550_top','max_atn_1625_top','max_atn_1383_top',
    'max_atn_1310_bottom','max_atn_1550_bottom','max_atn_1625_bottom','max_atn_1383_bottom',
    'max_tb_1310','max_tb_1550','max_tb_1625','max_tb_1383',
    'atn_1310_tb','atn_1550_tb','atn_1625_tb','atn_1383_tb',
    'atn_uniformity_1310','atn_uniformity_1550','atn_uniformity_1625','atn_uniformity_1383',
    'mfd_uniformity_1310','mfd_uniformity_1550','mfd_uniformity_1625','mfd_uniformity_1383',
    'step_1310_size','step_1550_size','step_1625_size','step_1383_size',
    'spike_1310_size','spike_1550_size','spike_1625_size','spike_1383_size',
    'spec_1310','spec_1550','spec_1285_1330',
    'mfd_1310_top','mfd_1310_bottom','mfd_1550_top','mfd_1550_bottom',
    'effective_area_1310','effective_area_1550',
    'cut_off_top','cut_off_bottom','cable_cut_off','mac_value',
    'clad_dia_top','clad_dia_bottom','core_clad_concentricity_top','core_clad_concentricity_bottom',
    'clad_ovality_top','clad_ovality_bottom','core_dia_top','core_dia_bottom',
    'core_ovality_top','core_ovality_bottom','primary_coating_dia_top','primary_coating_dia_bottom',
    'secondary_coating_dia_top','secondary_coating_dia_bottom',
    'primary_coating_concentricity_top','primary_coating_concentricity_bottom',
    'secondary_coating_concentricity_top','secondary_coating_concentricity_bottom',
    'coating_ovality_top','coating_ovality_bottom',
    'fiber_curl_top','fiber_curl_bottom','curl_defection_top','curl_defection_bottom',
    'zero_disp_wave','slope_zero_disp','disp_1550','disp_1285_1330','disp_1270_1340','disp_1575','disp_1460','disp_1490','slope_1490',
    'cd_1460','disp_1625','disp_1570','disp_1260','disp_slope','pmd_1310','pmd_1550',
    'm_100t_50mm_1550','m_100t_50mm_1310','m_100t_50mm_1625',
    'm_100t_60mm_1550','m_100t_60mm_1310','m_100t_60mm_1625',
    'm_1t_32mm_1550','m_1t_32mm_1310','m_1t_32mm_1625',
    'm_10t_30mm_1550','m_10t_30mm_1310','m_10t_30mm_1625',
    'm_1t_20mm_1550','m_1t_20mm_1310','m_1t_20mm_1625',
    'm_1t_15mm_1550','m_1t_15mm_1310','m_1t_15mm_1625',
    'm_1t_10mm_1550','m_1t_10mm_1310','m_1t_10mm_1625'
];

export const updateMissingValuesS = async (bobbin_no, values) => {
    // Case-insensitive matching: convert keys to lowercase for comparison
    const allowedLower = ALLOWED_QC_COLUMNS.map(c => c.toLowerCase());

    const validFields = Object.entries(values).filter(([key]) => allowedLower.includes(key.toLowerCase()));

    if (validFields.length === 0) {
        throw new Error("No valid fields provided.");
    }

    const setClauses = validFields.map(([key], i) => `"${key}" = $${i + 1}`);
    const params = validFields.map(([_, val]) => val);
    params.push(bobbin_no);

    const query = `UPDATE qc_entry_temp SET ${setClauses.join(', ')} WHERE bobbin_no = $${params.length}`;
    await pool.query(query, params);

    return { success: true, message: "Missing QC values updated successfully." };
};
