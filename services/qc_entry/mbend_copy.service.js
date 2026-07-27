import pool from "../../db/postgres.js";

const MBEND_COLUMNS = [
    'm_100t_50mm_1550', 'm_100t_50mm_1310', 'm_100t_50mm_1625',
    'm_100t_60mm_1550', 'm_100t_60mm_1310', 'm_100t_60mm_1625',
    'm_1t_32mm_1550', 'm_1t_32mm_1310', 'm_1t_32mm_1625',
    'm_10t_30mm_1550', 'm_10t_30mm_1310', 'm_10t_30mm_1625',
    'm_1t_20mm_1550', 'm_1t_20mm_1310', 'm_1t_20mm_1625',
    'm_1t_15mm_1550', 'm_1t_15mm_1310', 'm_1t_15mm_1625',
    'm_1t_10mm_1550', 'm_1t_10mm_1310', 'm_1t_10mm_1625',
];

export const mbendCopyS = async (bobbin_no) => {
    let mbend_copied = false;
    let mac_calculated = false;
    let sample_fid = null;
    let mac_value = null;

    // Step 1: Get the scanned bobbin's pt_entry record
    const ptEntry = await pool.query(
        `SELECT * FROM pt_entry WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (ptEntry.rows.length === 0) {
        return { success: false, message: "Bobbin not found in pt_entry" };
    }

    const currentBobbin = ptEntry.rows[0];
    const spool_id = currentBobbin.spool_id;
    const startLength = parseFloat(currentBobbin.start_length) || 0;

    // Step 5: Calculate MAC Value (independent of MBEnd copy)
    const qcCurrent = await pool.query(
        `SELECT mfd_1310_top, mfd_1310_bottom, cut_off_top, cut_off_bottom, mac_value
         FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (qcCurrent.rows.length > 0) {
        const qcData = qcCurrent.rows[0];
        const mfd = parseFloat(qcData.mfd_1310_top) || parseFloat(qcData.mfd_1310_bottom) || null;
        const cutoff = parseFloat(qcData.cut_off_top) || parseFloat(qcData.cut_off_bottom) || null;

        if (mfd && cutoff) {
            mac_value = (mfd * cutoff * 1000).toFixed(3);
            await pool.query(
                `UPDATE qc_entry_temp SET mac_value = $1 WHERE bobbin_no = $2`,
                [mac_value, bobbin_no]
            );
            mac_calculated = true;
            console.log(`[MBEnd] MAC calculated: ${mac_value} for ${bobbin_no}`);
        } else {
            console.log(`[MBEnd] MAC skipped: MFD or cut-off unavailable for ${bobbin_no}`);
        }
    }

    // Step 1 check: If full_mbend = true, skip MBEnd copy (but MAC was already done above)
    if (currentBobbin.full_mbend === true) {
        console.log(`[MBEnd] Skipping MBEnd copy: ${bobbin_no} has full_mbend=true`);
        return { success: true, message: "full_mbend bobbin - MBEnd copy skipped", mbend_copied, mac_calculated, mac_value };
    }

    // Step 2: Find the nearest PREVIOUS sample bobbin in the same spool
    const sampleResult = await pool.query(
        `SELECT bobbin_no, fid, start_length FROM pt_entry
         WHERE spool_id = $1 AND is_sample = true AND start_length < $2
         ORDER BY start_length DESC LIMIT 1`,
        [spool_id, startLength]
    );

    if (sampleResult.rows.length === 0) {
        console.log(`[MBEnd] No previous sample found for ${bobbin_no}`);
        return { success: true, message: "No previous sample bobbin found", mbend_copied, mac_calculated, mac_value };
    }

    const sampleBobbin = sampleResult.rows[0];
    sample_fid = sampleBobbin.fid;
    console.log(`[MBEnd] Previous sample found: ${sampleBobbin.bobbin_no} (FID: ${sample_fid})`);

    // Step 3: Validate the sample bobbin's qc_entry_temp record
    const sampleQC = await pool.query(
        `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [sampleBobbin.bobbin_no]
    );

    if (sampleQC.rows.length === 0) {
        console.log(`[MBEnd] Sample ${sampleBobbin.bobbin_no} has no qc_entry_temp record`);
        return { success: true, message: "Sample has no QC temp record", mbend_copied, mac_calculated, mac_value };
    }

    const sampleData = sampleQC.rows[0];

    // Check temp_grade is valid (not NULL, not 'REW', not 'FAIL')
    if (!sampleData.temp_grade || sampleData.temp_grade === 'REW' || sampleData.temp_grade === 'FAIL') {
        console.log(`[MBEnd] Sample temp_grade invalid: ${sampleData.temp_grade}`);
        return { success: true, message: "Sample temp_grade is NULL/REW/FAIL", mbend_copied, mac_calculated, mac_value };
    }

    // Step 4: Copy MBEnd values from sample to current bobbin
    const setClauses = MBEND_COLUMNS.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const mbValues = MBEND_COLUMNS.map(col => sampleData[col] ?? null);

    await pool.query(
        `UPDATE qc_entry_temp SET ${setClauses} WHERE bobbin_no = $${MBEND_COLUMNS.length + 1}`,
        [...mbValues, bobbin_no]
    );

    mbend_copied = true;
    console.log(`[MBEnd] Copied ${MBEND_COLUMNS.length} MBEnd columns from ${sampleBobbin.bobbin_no} to ${bobbin_no}`);

    return { success: true, message: "MBEnd copy + MAC calc done", mbend_copied, mac_calculated, sample_fid, mac_value };
};
