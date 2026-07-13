import pool from "../../db/postgres.js";

// API 1: Validate and get bobbin details for PV scan
export const getBobbinForPvS = async (bobbin_no) => {
    const query = `
        SELECT 
            fid_create_id,
            fid,
            bobbin_no,
            spool_id,
            spool_fid,
            preform_id,
            fiber_type,
            fiber_color,
            fiber_length,
            drawn_length,
            operator,
            tower_no,
            pt_machine_no,
            preform_type,
            product_type,
            is_pv,
            temp_grade,
            final_grade,
            is_d2,
            d2_issue,
            is_h2,
            h2_issue
        FROM bobbin_entries
        WHERE bobbin_no = $1
    `;

    const result = await pool.query(query, [bobbin_no]);

    if (result.rows.length === 0) {
        return { found: false, message: "Bobbin not found." };
    }

    const bobbin = result.rows[0];

    // Validation: temp_grade check from qc_entry_temp table
    const qcTempResult = await pool.query(
        `SELECT temp_grade FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    const tempGrade = qcTempResult.rows[0]?.temp_grade || null;

    if (tempGrade === null || tempGrade === undefined) {
        return { found: true, valid: false, message: "QC is not completed for this bobbin." };
    }
    if (tempGrade === "REW") {
        return { found: true, valid: false, message: "Bobbin is in REW status." };
    }
    if (tempGrade === "FAIL") {
        return { found: true, valid: false, message: "Bobbin has failed QC." };
    }

    // Check if PV record already exists
    const pvCheck = await pool.query(
        `SELECT pv_entry_id FROM pv_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    const has_pv_record = pvCheck.rows.length > 0;

    // D2 validation - return status for frontend to handle
    let d2_status = null;
    if (bobbin.is_d2 === true) {
        d2_status = { type: "info", message: "D2 process has already been completed for this bobbin." };
    } else if (bobbin.d2_issue) {
        d2_status = { type: "confirm", message: "This bobbin is currently under D2 processing. Do you want to proceed?" };
    }

    // H2 validation - return status for frontend to handle
    let h2_status = null;
    if (bobbin.is_h2 === true) {
        h2_status = { type: "info", message: "H2 process has already been completed for this bobbin." };
    } else if (bobbin.h2_issue) {
        h2_status = { type: "confirm", message: "This bobbin is currently under H2 processing. Do you want to proceed?" };
    }

    return {
        found: true,
        valid: true,
        data: bobbin,
        has_pv_record,
        d2_status,
        h2_status
    };
};

// API 2: Update bobbin fiber_color
export const updateBobbinColorS = async (bobbin_no, new_color) => {
    const query = `
        UPDATE bobbin_entries
        SET fiber_color = $1
        WHERE bobbin_no = $2
        RETURNING *;
    `;

    const result = await pool.query(query, [new_color, bobbin_no]);

    if (result.rowCount === 0) {
        throw new Error("Bobbin not found.");
    }

    return result.rows[0];
};

// API 3: Submit PV Entry (insert new OR update existing based on has_pv_record flag)
export const pvEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { header, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            if (bobbin.has_pv_record) {
                // UPDATE existing PV record
                await client.query(
                    `
                    UPDATE pv_entries
                    SET 
                        pv_type = $1,
                        pv_operator = $2,
                        shift = $3,
                        pv_date = $4,
                        pv_time = $5,
                        pv_remark = $6,
                        logged_in_user = $7,
                        updated_at = NOW()
                    WHERE bobbin_no = $8
                    `,
                    [
                        header.pv_type,
                        header.pv_operator,
                        header.shift,
                        header.pv_date,
                        header.pv_time,
                        header.pv_remark,
                        logged_in_user,
                        bobbin.bobbin_no
                    ]
                );
            } else {
                // INSERT new PV record
                await client.query(
                    `
                    INSERT INTO pv_entries (
                        pv_type, pv_operator, shift, pv_date, pv_time, pv_remark,
                        bobbin_no, bobbin_fid, spool_id, spool_fid, preform_id,
                        fiber_type, colour, qty_kms, logged_in_user
                    )
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                    `,
                    [
                        header.pv_type,
                        header.pv_operator,
                        header.shift,
                        header.pv_date,
                        header.pv_time,
                        header.pv_remark,
                        bobbin.bobbin_no,
                        bobbin.bobbin_fid,
                        bobbin.spool_id,
                        bobbin.spool_fid,
                        bobbin.preform_id,
                        bobbin.fiber_type,
                        bobbin.fiber_color,
                        bobbin.qty_kms,
                        logged_in_user
                    ]
                );

                // Update bobbin_entries: mark as PV done
                await client.query(
                    `UPDATE bobbin_entries SET is_pv = true WHERE bobbin_no = $1`,
                    [bobbin.bobbin_no]
                );
            }
        }

        await client.query("COMMIT");

        return {
            success: true,
            message: `${bobbins.length} bobbin(s) verified successfully`
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// API 4: Validate bobbin for Re-PV
export const getBobbinForRePvS = async (bobbin_no) => {
    // Step 1: Check bobbin exists
    const bobbinResult = await pool.query(
        `SELECT 
            bobbin_no, fid, spool_id, spool_fid, preform_id,
            fiber_type, fiber_color, fiber_length, drawn_length,
            temp_grade, final_grade, operator
        FROM bobbin_entries
        WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinResult.rows.length === 0) {
        return { success: false, message: "Bobbin not found." };
    }

    const bobbin = bobbinResult.rows[0];

    // Step 2: Check final_grade from qc_entry_temp
    const qcTempResult = await pool.query(
        `SELECT final_grade FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    const finalGrade = qcTempResult.rows[0]?.final_grade || null;

    if (!finalGrade || finalGrade === '') {
        return { success: false, message: "This bobbin does not have a Final Grade. Re-Physical Verification cannot be performed." };
    }

    // Step 3: Check PV record exists
    const pvResult = await pool.query(
        `SELECT pv_entry_id FROM pv_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (pvResult.rows.length === 0) {
        return { success: false, message: "No existing Physical Verification record found for this bobbin." };
    }

    // Step 4: Return valid data
    return {
        success: true,
        data: {
            ...bobbin,
            has_pv_record: true
        }
    };
};

// API 5: Re-PV Entry (update existing PV records)
export const rePvEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { header, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            const updateResult = await client.query(
                `
                UPDATE pv_entries
                SET 
                    pv_operator = $1,
                    shift = $2,
                    pv_date = $3,
                    pv_time = $4,
                    pv_remark = $5,
                    logged_in_user = $6,
                    updated_at = NOW()
                WHERE bobbin_no = $7
                `,
                [
                    header.pv_operator,
                    header.shift,
                    header.pv_date,
                    header.pv_time,
                    header.pv_remark,
                    logged_in_user,
                    bobbin.bobbin_no
                ]
            );

            if (updateResult.rowCount === 0) {
                throw new Error(`PV record not found for bobbin: ${bobbin.bobbin_no}`);
            }
        }

        await client.query("COMMIT");

        return {
            success: true,
            message: `${bobbins.length} PV record(s) updated successfully`
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
