import pool from "../../db/postgres.js";

export const getPendingQcOutS = async (from_date, to_date) => {
    let query = `
        SELECT b.bobbin_no, b.fid AS bobbin_fid, b.product_type, q.final_grade
        FROM bobbin_entries b
        INNER JOIN qc_entry q ON q.bobbin_no = b.bobbin_no
        WHERE b.is_qc_out = false
          AND q.final_grade IS NOT NULL
          AND q.final_grade != ''
          AND q.final_grade NOT IN ('REW', 'FAIL', 'REWH2')
    `;

    const params = [];

    if (from_date && to_date) {
        params.push(from_date, to_date);
        query += ` AND b.pt_date BETWEEN $1 AND $2`;
    }

    query += ` ORDER BY b.pt_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const bulkValidateQcOutS = async (bobbins) => {
    const results = [];

    for (const bobbin_no of bobbins) {
        // 1. Check bobbin_entries
        const bobbinResult = await pool.query(
            `SELECT bobbin_no, fid, product_type, is_qc_out FROM bobbin_entries WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        if (bobbinResult.rows.length === 0) {
            results.push({ bobbin_no, bobbin_fid: null, product_type: null, final_grade: null, is_valid: false, reason: "Bobbin not found in bobbin_entries" });
            continue;
        }

        const bobbin = bobbinResult.rows[0];

        // 2. Check if already marked QC Out
        if (bobbin.is_qc_out === true) {
            results.push({ bobbin_no, bobbin_fid: bobbin.fid, product_type: bobbin.product_type, final_grade: null, is_valid: false, reason: "Already QC Out" });
            continue;
        }

        // 3. Check if already exists in qc_out table
        const qcOutExists = await pool.query(
            `SELECT 1 FROM qc_out WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        if (qcOutExists.rows.length > 0) {
            results.push({ bobbin_no, bobbin_fid: bobbin.fid, product_type: bobbin.product_type, final_grade: null, is_valid: false, reason: "Already exists in QC Out records" });
            continue;
        }

        // 4. Check qc_entry
        const qcResult = await pool.query(
            `SELECT final_grade FROM qc_entry WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        if (qcResult.rows.length === 0) {
            results.push({ bobbin_no, bobbin_fid: bobbin.fid, product_type: bobbin.product_type, final_grade: null, is_valid: false, reason: "No QC entry found for this bobbin" });
            continue;
        }

        const final_grade = qcResult.rows[0].final_grade;

        // 5. Check final_grade not null / empty
        if (!final_grade || final_grade.trim() === '') {
            results.push({ bobbin_no, bobbin_fid: bobbin.fid, product_type: bobbin.product_type, final_grade: null, is_valid: false, reason: "Final grade is pending" });
            continue;
        }

        // 6. Check final_grade not in exclusion list
        const upperGrade = final_grade.toUpperCase();
        if (['REW', 'FAIL', 'REWH2'].includes(upperGrade)) {
            results.push({ bobbin_no, bobbin_fid: bobbin.fid, product_type: bobbin.product_type, final_grade, is_valid: false, reason: `Final grade is ${final_grade}, cannot QC Out` });
            continue;
        }

        // All checks passed
        results.push({ bobbin_no, bobbin_fid: bobbin.fid, product_type: bobbin.product_type, final_grade, is_valid: true, reason: "" });
    }

    return results;
};

export const submitQcOutS = async (payload) => {
    const { user, shift, bobbins, logged_in_user, out_date: payloadOutDate } = payload;
    const results = [];

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        for (const rawBobbin of bobbins) {
            // Accept both shapes: a plain bobbin_no string or an object { bobbin_no, ... }
            const isObject = rawBobbin !== null && typeof rawBobbin === "object";
            const bobbin_no = isObject ? rawBobbin.bobbin_no : rawBobbin;
            const payloadOutTime = isObject ? rawBobbin.out_time : undefined;
            // 1. Check bobbin exists in bobbin_entries
            const bobbinResult = await client.query(
                `SELECT bobbin_no, fid, product_type, is_qc_out FROM bobbin_entries WHERE bobbin_no = $1`,
                [bobbin_no]
            );

            if (bobbinResult.rows.length === 0) {
                results.push({ bobbin_no, bobbin_fid: "", product_type: "", final_grade: "", is_qc_out: false, reason: "Bobbin not found in bobbin_entries" });
                continue;
            }

            const bobbin = bobbinResult.rows[0];

            // 2. Check if already marked QC Out in bobbin_entries
            if (bobbin.is_qc_out === true) {
                results.push({ bobbin_no, bobbin_fid: bobbin.fid || "", product_type: bobbin.product_type || "", final_grade: "", is_qc_out: false, reason: "Already QC Out" });
                continue;
            }

            // 3. Check if already exists in qc_out table
            const qcOutExists = await client.query(
                `SELECT 1 FROM qc_out WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin_no]
            );

            if (qcOutExists.rows.length > 0) {
                results.push({ bobbin_no, bobbin_fid: bobbin.fid || "", product_type: bobbin.product_type || "", final_grade: "", is_qc_out: false, reason: "Already exists in QC Out records" });
                continue;
            }

            // 4. Check bobbin exists in qc_entry and get final_grade + optical_length
            const qcResult = await client.query(
                `SELECT final_grade, optical_length FROM qc_entry WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin_no]
            );

            if (qcResult.rows.length === 0) {
                results.push({ bobbin_no, bobbin_fid: bobbin.fid || "", product_type: bobbin.product_type || "", final_grade: "", is_qc_out: false, reason: "No QC entry found" });
                continue;
            }

            const final_grade = qcResult.rows[0].final_grade;
            const fiber_length = qcResult.rows[0].optical_length;

            // 5. Check final_grade is not null / empty
            if (!final_grade || final_grade.trim() === '') {
                results.push({ bobbin_no, bobbin_fid: bobbin.fid || "", product_type: bobbin.product_type || "", final_grade: "", is_qc_out: false, reason: "Final grade is pending" });
                continue;
            }

            // 6. Check final_grade not in exclusion list
            const upperGrade = final_grade.toUpperCase();
            if (['REW', 'FAIL', 'REWH2'].includes(upperGrade)) {
                results.push({ bobbin_no, bobbin_fid: bobbin.fid || "", product_type: bobbin.product_type || "", final_grade, is_qc_out: false, reason: `Final grade is ${final_grade}, cannot QC Out` });
                continue;
            }

            // 7. All checks passed — update bobbin_entries and insert into qc_out
            await client.query(
                `UPDATE bobbin_entries SET is_qc_out = true WHERE bobbin_no = $1`,
                [bobbin_no]
            );

            // Use payload-provided out_date/out_time when present, otherwise generate now
            const now = new Date();
            const out_date = payloadOutDate || now.toISOString().split('T')[0]; // YYYY-MM-DD
            const out_time = payloadOutTime || now.toTimeString().split(' ')[0]; // HH:MM:SS

            // Log QC out entry
            await client.query(
                `INSERT INTO qc_out (bobbin_no, bobbin_fid, out_date, out_time, "user", shift, fiber_length, logged_in_user)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [bobbin_no, bobbin.fid, out_date, out_time, user, shift, fiber_length, logged_in_user]
            );

            // 8. Queue a stock_transfer row for this bobbin
            const material_code = `SMF${(bobbin.product_type || "").toString().trim()}`;

            // Queue a location-to-location (311) transfer in the unified
            // transactions table for the SAP posting scheduler.
            await client.query(
                `
                INSERT INTO transactions (
                    type, comp_material_code, plant, s_location, comp_batch,
                    receiving_plant, receiving_s_location, comp_quantity, uom,
                    ud_required, status, created_at
                )
                VALUES ('LTL',$1,$2,$3,$4,$5,$6,$7,$8,false,false,current_timestamp)
                `,
                [
                    material_code,   // SMF + product_type -> comp_material_code
                    1200,            // plant
                    "D2N2",          // s_location
                    bobbin_no,       // comp_batch
                    1200,            // receiving_plant
                    "1206",          // receiving_s_location
                    fiber_length,    // comp_quantity (optical_length from qc_entry)
                    "KM",            // uom
                ]
            );

            results.push({ bobbin_no, bobbin_fid: bobbin.fid || "", product_type: bobbin.product_type || "", final_grade, is_qc_out: true, reason: "" });
        }

        await client.query("COMMIT");
        return results;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const validateBobbinForQcOutS = async (bobbin_no) => {
    // 1. Check bobbin exists in bobbin_entries
    const result = await pool.query(
        `SELECT bobbin_no, fid, fiber_type, fiber_color, fiber_length, is_qc_out, product_type
         FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return { success: false, message: "Bobbin not found." };
    }

    const bobbin = result.rows[0];

    // 2. Check if already marked QC Out
    if (bobbin.is_qc_out === true) {
        return { success: false, message: "Already QC Out" };
    }

    // 3. Check if already exists in qc_out table
    const qcOutExists = await pool.query(
        `SELECT 1 FROM qc_out WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (qcOutExists.rows.length > 0) {
        return { success: false, message: "Already exists in QC Out records" };
    }

    // 4. Get final_grade from qc_entry
    const qcEntryResult = await pool.query(
        `SELECT final_grade FROM qc_entry WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (qcEntryResult.rows.length === 0) {
        return { success: false, message: "Final grade is pending for this bobbin." };
    }

    const final_grade = qcEntryResult.rows[0].final_grade?.toUpperCase();

    // 5. Check final_grade not null / empty
    if (!final_grade || final_grade === '' || final_grade === 'null') {
        return { success: false, message: "Final grade is pending for this bobbin." };
    }

    // 6. Check final_grade not in exclusion list
    if (final_grade === 'FAIL' || final_grade === 'REW' || final_grade === "REWH2") {
        return { success: false, message: `This bobbin cannot be QC Out because its final grade is ${final_grade}.` };
    }

    return {
        success: true,
        data: {
            bobbin_no: bobbin.bobbin_no,
            bobbin_fid: bobbin.fid,
            fiber_type: bobbin.fiber_type,
            fiber_color: bobbin.fiber_color,
            fiber_length: bobbin.fiber_length,
            product_type: bobbin.product_type,
            final_grade
        }
    };
};


