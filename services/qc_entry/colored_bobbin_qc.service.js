import pool from "../../db/postgres.js";

/**
 * QC measurement parameters to copy from parent bobbin's QC record
 * to the colored bobbin's qc_entry_temp record.
 * 
 * IMPORTANT: Only explicitly configured parameters are copied.
 * Add or remove fields here as needed — this is the single source of truth.
 */
const COLORED_BOBBIN_COPY_FIELDS = [
    // Attenuation
   // 'avg_lsa_atn_1310', 'avg_lsa_atn_1550', 'avg_lsa_atn_1625', 'avg_lsa_atn_1383',
   // 'max_lsa_atn_1310', 'max_lsa_atn_1550', 'max_lsa_atn_1625', 'max_lsa_atn_1383',
   // 'min_lsa_atn_1310', 'min_lsa_atn_1550', 'min_lsa_atn_1625', 'min_lsa_atn_1383',
   // 'atn_1310_top', 'atn_1550_top', 'atn_1625_top', 'atn_1383_top',
   // 'atn_1310_bottom', 'atn_1550_bottom', 'atn_1625_bottom', 'atn_1383_bottom',
   // 'max_atn_1310_top', 'max_atn_1550_top', 'max_atn_1625_top', 'max_atn_1383_top',
   // 'max_atn_1310_bottom', 'max_atn_1550_bottom', 'max_atn_1625_bottom', 'max_atn_1383_bottom',
   // 'max_tb_1310', 'max_tb_1550', 'max_tb_1625', 'max_tb_1383',
   // 'atn_1310_tb', 'atn_1550_tb', 'atn_1625_tb', 'atn_1383_tb',
   // 'atn_uniformity_1310', 'atn_uniformity_1550', 'atn_uniformity_1625', 'atn_uniformity_1383',

    // MFD
    //'mfd_uniformity_1310', 'mfd_uniformity_1550', 'mfd_uniformity_1625', 'mfd_uniformity_1383',
    //'mfd_1310_top', 'mfd_1310_bottom', 'mfd_1550_top', 'mfd_1550_bottom',

    // Step/Spike
    //'step_1310_size', 'step_1550_size', 'step_1625_size', 'step_1383_size',
    //'spike_1310_size', 'spike_1550_size', 'spike_1625_size', 'spike_1383_size',

    // Spectral attenuation
    //'spec_1310', 'spec_1550', 'spec_1285_1330',

    // Effective area
    'effective_area_1310', 'effective_area_1550',

    // Cut-off & MAC
    'cut_off_top', 'cut_off_bottom', 'cable_cut_off', 'mac_value',

    // Geometry
    'clad_dia_top', 'clad_dia_bottom',
    'core_clad_concentricity_top', 'core_clad_concentricity_bottom',
    'clad_ovality_top', 'clad_ovality_bottom',
    'core_dia_top', 'core_dia_bottom',
    'core_ovality_top', 'core_ovality_bottom',
    'primary_coating_dia_top', 'primary_coating_dia_bottom',
    'secondary_coating_dia_top', 'secondary_coating_dia_bottom',
    'primary_coating_concentricity_top', 'primary_coating_concentricity_bottom',
    'secondary_coating_concentricity_top', 'secondary_coating_concentricity_bottom',
    'coating_ovality_top', 'coating_ovality_bottom',

    // Curl
    'fiber_curl_top', 'fiber_curl_bottom',
    'curl_defection_top', 'curl_defection_bottom',

    // Dispersion
    'zero_disp_wave', 'slope_zero_disp',
    'disp_1550', 'disp_1285_1330', 'disp_1270_1340', 'disp_1575',
    'disp_1460', 'disp_1490', 'slope_1490',
    'cd_1460', 'disp_1625', 'disp_1570', 'disp_1260', 'disp_slope',

    // PMD
    'pmd_1310', 'pmd_1550',

    // MBend
    'm_100t_50mm_1550', 'm_100t_50mm_1310', 'm_100t_50mm_1625',
    'm_100t_60mm_1550', 'm_100t_60mm_1310', 'm_100t_60mm_1625',
    'm_1t_32mm_1550', 'm_1t_32mm_1310', 'm_1t_32mm_1625',
    'm_10t_30mm_1550', 'm_10t_30mm_1310', 'm_10t_30mm_1625',
    'm_1t_20mm_1550', 'm_1t_20mm_1310', 'm_1t_20mm_1625',
    'm_1t_15mm_1550', 'm_1t_15mm_1310', 'm_1t_15mm_1625',
    'm_1t_10mm_1550', 'm_1t_10mm_1310', 'm_1t_10mm_1625',
];

/**
 * Handles the colored bobbin QC parameter copy logic.
 * 
 * Flow:
 * 1. Check if bobbin exists in coloring_entry
 * 2. If not found → return is_colored: false (skip)
 * 3. If found → get parent_bobbin_no
 * 4. Check if colored bobbin already exists in qc_entry_temp
 * 5. If already exists → return existing: true (do not copy again)
 * 6. If not exists → find parent QC record (qc_entry first, then qc_entry_temp)
 * 7. Copy configured parameters into qc_entry_temp for the colored bobbin
 */
export const handleColoredBobbinQcS = async (bobbin_no) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Step 1: Check if bobbin exists in coloring_entry
        const coloringResult = await client.query(
            `SELECT bobbin_no, parent_bobbin_no FROM coloring_entry WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        if (coloringResult.rows.length === 0) {
            // Not a colored bobbin — skip entirely
            await client.query("COMMIT");
            return {
                success: true,
                is_colored: false,
                copied: false
            };
        }

        const coloringRecord = coloringResult.rows[0];
        const parent_bobbin_no = coloringRecord.parent_bobbin_no;

        // Validate parent_bobbin_no exists
        if (!parent_bobbin_no) {
            await client.query("COMMIT");
            return {
                success: true,
                is_colored: true,
                copied: false,
                message: "Colored bobbin found but parent_bobbin_no is missing."
            };
        }

        // Step 2: Check if colored bobbin already has data in qc_entry_temp
        const existingTemp = await client.query(
            `SELECT bobbin_no FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        if (existingTemp.rows.length > 0) {
            // Already exists — do NOT copy parent QC data again
            await client.query("COMMIT");
            return {
                success: true,
                is_colored: true,
                copied: false,
                existing: true
            };
        }

        // Step 3: Find parent QC record
        // Priority: qc_entry (finalized) first, then qc_entry_temp
        let parentQcData = null;

        const parentQcFinal = await client.query(
            `SELECT * FROM qc_entry WHERE bobbin_no = $1 LIMIT 1`,
            [parent_bobbin_no]
        );

        if (parentQcFinal.rows.length > 0) {
            parentQcData = parentQcFinal.rows[0];
        } else {
            // Fallback to qc_entry_temp
            const parentQcTemp = await client.query(
                `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
                [parent_bobbin_no]
            );

            if (parentQcTemp.rows.length > 0) {
                parentQcData = parentQcTemp.rows[0];
            }
        }

        if (!parentQcData) {
            // Parent QC record not found — cannot copy
            await client.query("COMMIT");
            return {
                success: true,
                is_colored: true,
                copied: false,
                message: "Parent QC record not found for parent bobbin: " + parent_bobbin_no
            };
        }

        // Step 4: Get colored bobbin's identifying info from bobbin_entries
        const bobbinInfo = await client.query(
            `SELECT fid, product_type FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        const bobbin_fid = bobbinInfo.rows.length > 0 ? bobbinInfo.rows[0].fid : null;
        const product_type = bobbinInfo.rows.length > 0 ? bobbinInfo.rows[0].product_type : null;

        // Step 5: Build the INSERT for qc_entry_temp with only configured fields
        // Start with identity columns for the colored bobbin
        const insertColumns = ['bobbin_no', 'bobbin_fid', 'product_type'];
        const insertValues = [bobbin_no, bobbin_fid, product_type];

        // Add only configured QC measurement parameters from parent
        for (const field of COLORED_BOBBIN_COPY_FIELDS) {
            const value = parentQcData[field];
            if (value !== undefined && value !== null && value !== '') {
                insertColumns.push(field);
                insertValues.push(value);
            }
        }

        const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');

        await client.query(
            `INSERT INTO qc_entry_temp (${insertColumns.join(', ')}) VALUES (${placeholders})`,
            insertValues
        );

        await client.query("COMMIT");

        return {
            success: true,
            is_colored: true,
            copied: true,
            message: "Colored bobbin QC parameters copied successfully."
        };

    } catch (error) {
        await client.query("ROLLBACK");
        console.error('[ColoredBobbinQC] Error:', error.message);
        throw error;
    } finally {
        client.release();
    }
};
