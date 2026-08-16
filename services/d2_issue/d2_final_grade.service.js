import pool from "../../db/postgres.js";

/**
 * Helper: Copy qc_entry_temp row into qc_entry (upsert)
 */
const copyTempToQcEntry = async (client, tempRow) => {
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
};

/**
 * Process a single bobbin for final grade assignment.
 * Returns { bobbin_no, fid, product_type, temp_grade, final_grade, status, remark }
 */
const processSingleBobbin = async (client, bobbin_no) => {
    const emptyResult = (status, remark) => ({
        bobbin_no,
        fid: '',
        product_type: '',
        temp_grade: '',
        final_grade: '',
        status,
        remark
    });

    // Step 1: Check bobbin_entries
    const bobbinRes = await client.query(
        `SELECT * FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinRes.rows.length === 0) {
        return emptyResult('error', 'Bobbin not available in bobbin_entries');
    }

    const bobbin = bobbinRes.rows[0];

    // Step 2: Check qc_entry_temp
    const tempRes = await client.query(
        `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (tempRes.rows.length === 0) {
        return emptyResult('error', 'Bobbin not available in qc_entry_temp');
    }

    const tempRow = tempRes.rows[0];

    // Step 3: Check temp_grade in qc_entry_temp
    const tempGrade = tempRow.temp_grade;
    if (!tempGrade || tempGrade === '') {
        return {
            bobbin_no,
            fid: bobbin.fid || '',
            product_type: bobbin.product_type || '',
            temp_grade: '',
            final_grade: '',
            status: 'error',
            remark: 'Temp grade not available'
        };
    }

    // Step 4: Check final_grade in qc_entry_temp
    const tempFinalGrade = tempRow.final_grade;

    if (tempFinalGrade && tempFinalGrade !== '') {
        // Step 4a: final_grade exists in qc_entry_temp — check qc_entry
        const qcEntryRes = await client.query(
            `SELECT * FROM qc_entry WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        if (qcEntryRes.rows.length > 0 && qcEntryRes.rows[0].final_grade && qcEntryRes.rows[0].final_grade !== '') {
            // Already has final grade in qc_entry
            return {
                bobbin_no,
                fid: bobbin.fid || '',
                product_type: bobbin.product_type || '',
                temp_grade: tempGrade,
                final_grade: tempFinalGrade,
                status: 'already_done',
                remark: 'Already has final grade'
            };
        }

        // Not in qc_entry yet — copy from qc_entry_temp
        await copyTempToQcEntry(client, tempRow);

        // Update bobbin_entries
        await client.query(
            `UPDATE bobbin_entries SET temp_grade = $1, final_grade = $2 WHERE bobbin_no = $3`,
            [tempGrade, tempFinalGrade, bobbin_no]
        );

        return {
            bobbin_no,
            fid: bobbin.fid || '',
            product_type: bobbin.product_type || '',
            temp_grade: tempGrade,
            final_grade: tempFinalGrade,
            status: 'success',
            remark: 'Final grade synced to qc_entry'
        };
    }

    // Step 4b: final_grade is NULL/empty — only temp_grade exists
    const { is_pv, is_d2 } = bobbin;

    if (is_pv === true && is_d2 === true) {
        // Assign final_grade = temp_grade
        await client.query(
            `UPDATE qc_entry_temp SET final_grade = $1 WHERE bobbin_no = $2`,
            [tempGrade, bobbin_no]
        );

        // Re-fetch updated qc_entry_temp row for copy
        const updatedTempRes = await client.query(
            `SELECT * FROM qc_entry_temp WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        // Insert into qc_entry
        await copyTempToQcEntry(client, updatedTempRes.rows[0]);

        // Update bobbin_entries
        await client.query(
            `UPDATE bobbin_entries SET temp_grade = $1, final_grade = $2 WHERE bobbin_no = $3`,
            [tempGrade, tempGrade, bobbin_no]
        );

        return {
            bobbin_no,
            fid: bobbin.fid || '',
            product_type: bobbin.product_type || '',
            temp_grade: tempGrade,
            final_grade: tempGrade,
            status: 'success',
            remark: 'Final grade assigned successfully'
        };
    }

    // Process not complete
    const pending = [];
    if (!is_pv) pending.push('PV');
    if (!is_d2) pending.push('D2');

    return {
        bobbin_no,
        fid: bobbin.fid || '',
        product_type: bobbin.product_type || '',
        temp_grade: tempGrade,
        final_grade: '',
        status: 'error',
        remark: `Pending: ${pending.join(', ')} not complete`
    };
};

/**
 * Single bobbin final grade
 */
export const d2FinalGradeSingleS = async (bobbin_no) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await processSingleBobbin(client, bobbin_no);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(error.message);
    } finally {
        client.release();
    }
};

/**
 * Bulk bobbin final grade — process each independently
 */
export const d2FinalGradeBulkS = async (bobbins) => {
    const results = [];

    for (const item of bobbins) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const result = await processSingleBobbin(client, item.bobbin_no);
            await client.query("COMMIT");
            results.push(result);
        } catch (error) {
            await client.query("ROLLBACK");
            results.push({
                bobbin_no: item.bobbin_no,
                fid: item.fid || '',
                product_type: item.product_type || '',
                temp_grade: item.temp_grade || '',
                final_grade: '',
                status: 'error',
                remark: error.message || 'Unexpected error'
            });
        } finally {
            client.release();
        }
    }

    return results;
};
