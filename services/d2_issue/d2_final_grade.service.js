import pool from "../../db/postgres.js";
import { postInspectionLotUd } from "../sap_integrate/inspection_lot/inspection_lot_ud.service.js";
import { resolveUdCode } from "../sap_integrate/inspection_lot/ud_code.js";

/**
 * Best-effort SAP Usage Decision (UD) posting for a bobbin once its final_grade
 * is set. NEVER throws and NEVER blocks the grading flow — any error is logged
 * and swallowed.
 *
 * Grade -> UD code (centralized in ../sap_integrate/inspection_lot/ud_code.js):
 *   REW  -> A2
 *   FAIL -> R3
 *   else -> A1
 *
 * The inspection lot is looked up from order_conf (fg_batch = bobbin_no). Only
 * rows with a real inspection_lot AND ud = false are posted; if ud is already
 * true the UD was posted before -> skip.
 *
 * @param {string} bobbin_no
 * @param {string} finalGrade
 * @returns {Promise<void>}
 */
const tryPostUdForBobbin = async (bobbin_no, finalGrade) => {
    try {
        if (!bobbin_no) return;
        if (finalGrade === null || finalGrade === undefined || String(finalGrade).trim() === "") {
            return;
        }

        // order_conf.fg_batch holds the FG bobbin_no. Only pick up rows with a
        // real lot that are not yet posted (ud = false).
        const lotResult = await pool.query(
            `SELECT inspection_lot
               FROM order_conf
              WHERE fg_batch = $1
                AND COALESCE(ud, false) = false
                AND inspection_lot IS NOT NULL
                AND inspection_lot <> 0
              ORDER BY order_conf_id DESC
              LIMIT 1`,
            [bobbin_no]
        );

        const row = lotResult.rows[0];
        if (!row) return; // no confirmation row / no lot / ud already true

        await postInspectionLotUd({
            InspectionLot: String(row.inspection_lot),
            UD_CODE: resolveUdCode(finalGrade),
            type: "FTUD",
        });
    } catch (error) {
        console.error(`[d2_final_grade][UD] Skipped UD post for bobbin ${bobbin_no}:`, error.message);
    }
};

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
 * If the final grade is DCA1, upgrade product_type to G657A1250 across
 * qc_entry_temp, qc_entry and bobbin_entries (mirrors qc_entry.service.js), and
 * record the movement (existing -> new) in material_move.
 *
 * Runs on the provided transaction client. Returns the effective product_type
 * (upgraded value when DCA1, otherwise the unchanged current value).
 *
 * @param {import('pg').PoolClient} client
 * @param {string} bobbin_no
 * @param {string} finalGrade
 * @param {string|null} currentProductType  product_type before any upgrade
 * @returns {Promise<string|null>} effective product_type after this step
 */
const applyDca1Upgrade = async (client, bobbin_no, finalGrade, currentProductType) => {
    if (finalGrade !== 'DCA1') return currentProductType;

    const upgradedProductType = 'G657A1250';

    await client.query(
        `UPDATE qc_entry_temp SET product_type = $2 WHERE bobbin_no = $1`,
        [bobbin_no, upgradedProductType]
    );

    await client.query(
        `UPDATE qc_entry SET product_type = $2 WHERE bobbin_no = $1`,
        [bobbin_no, upgradedProductType]
    );

    await client.query(
        `UPDATE bobbin_entries SET product_type = $2 WHERE bobbin_no = $1`,
        [bobbin_no, upgradedProductType]
    );

    // Record the product-type movement for later stock transfer.
    await client.query(
        `INSERT INTO material_move (bobbin_no, existing_product_type, new_product_type)
         VALUES ($1, $2, $3)`,
        [bobbin_no, currentProductType ?? null, upgradedProductType]
    );

    return upgradedProductType;
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

        // If final grade is DCA1, upgrade product_type + record material_move.
        const effectiveProductType = await applyDca1Upgrade(
            client, bobbin_no, tempFinalGrade, bobbin.product_type || null
        );

        return {
            bobbin_no,
            fid: bobbin.fid || '',
            product_type: effectiveProductType || '',
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

        // If final grade is DCA1, upgrade product_type + record material_move.
        const effectiveProductType = await applyDca1Upgrade(
            client, bobbin_no, tempGrade, bobbin.product_type || null
        );

        return {
            bobbin_no,
            fid: bobbin.fid || '',
            product_type: effectiveProductType || '',
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

        // Best-effort: post SAP UD after the grade is committed (never blocks).
        if (result?.status === 'success') {
            await tryPostUdForBobbin(result.bobbin_no, result.final_grade);
        }

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

            // Best-effort: post SAP UD after this bobbin is committed (never blocks the rest).
            if (result?.status === 'success') {
                await tryPostUdForBobbin(result.bobbin_no, result.final_grade);
            }

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
