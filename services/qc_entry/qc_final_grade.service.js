import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════════════════
// FINAL GRADE PROMOTION (Scan bobbin_no -> "Final Entry" button)
//
// Distinct from submitFinalQcS/submitFinalQcBulkS in qc_entry.service.js
// (which copies the ENTIRE qc_entry_temp row into qc_entry). This flow only
// promotes the already-graded qc_entry.temp_grade value into final_grade,
// across qc_entry, qc_entry_temp and bobbin_entries, and stamps
// bobbin_entries.final_grade_date.
//
// Flow (per bobbin):
//   1. bobbin_no not in bobbin_entries          -> error "Bobbin not found"
//   2. bobbin_entries.is_pv / is_d2 not both
//      true                                       -> error "Pending: PV, D2"
//                                                    (lists whichever is not done)
//   3. bobbin_no in qc_entry_temp but NOT in
//      qc_entry                                  -> error "First submit Grade
//                                                    on QC entry page"
//   4. bobbin_no in qc_entry with final_grade
//      already set                                -> error "QC grading
//                                                    already done"
//   5. Otherwise -> read temp_grade from qc_entry, copy it into final_grade
//      on qc_entry + qc_entry_temp + bobbin_entries, and stamp
//      bobbin_entries.final_grade_date = NOW().
//
// Supports both single bobbin and bulk (array of bobbin_no) usage — bulk
// processes each bobbin independently so one failure never aborts the batch.
// ═══════════════════════════════════════════════════════════════════════════

const isBlank = (v) => v === null || v === undefined || String(v).trim() === '';

/**
 * Process a single bobbin's final-grade promotion on a shared client/transaction.
 * Returns a result object describing the outcome — never throws for expected
 * business-rule failures (only for unexpected DB errors, which the caller
 * wraps in try/catch).
 *
 * @param {import('pg').PoolClient} client
 * @param {string} bobbin_no
 * @returns {Promise<{ bobbin_no: string, status: string, message: string, final_grade?: string }>}
 */
const processFinalGradePromotion = async (client, bobbin_no) => {
    // Step 1: must exist in bobbin_entries
    const bobbinRes = await client.query(
        `SELECT bobbin_no, is_pv, is_d2 FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinRes.rows.length === 0) {
        return { bobbin_no, status: 'error', message: 'Bobbin not found' };
    }

    // Step 2: PV and D2 process must both be complete
    const { is_pv, is_d2 } = bobbinRes.rows[0];

    if (is_pv !== true || is_d2 !== true) {
        const pending = [];
        if (is_pv !== true) pending.push('PV');
        if (is_d2 !== true) pending.push('D2');

        return { bobbin_no, status: 'error', message: `Pending: ${pending.join(', ')}` };
    }

    // Step 3: must exist in qc_entry_temp
    const tempRes = await client.query(
        `SELECT bobbin_no FROM qc_entry_temp WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (tempRes.rows.length === 0) {
        return { bobbin_no, status: 'error', message: 'First submit Grade on QC entry page' };
    }

    // Step 3b: must also exist in qc_entry
    const qcEntryRes = await client.query(
        `SELECT temp_grade, final_grade FROM qc_entry WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (qcEntryRes.rows.length === 0) {
        return { bobbin_no, status: 'error', message: 'First submit Grade on QC entry page' };
    }

    const { temp_grade: tempGrade, final_grade: existingFinalGrade } = qcEntryRes.rows[0];

    // Step 4: final_grade already set -> already done
    if (!isBlank(existingFinalGrade)) {
        return { bobbin_no, status: 'error', message: 'QC grading already done' };
    }

    // Guard: no temp_grade to promote (shouldn't normally happen if grade step was done)
    if (isBlank(tempGrade)) {
        return { bobbin_no, status: 'error', message: 'First submit Grade on QC entry page' };
    }

    // Step 5: promote temp_grade -> final_grade everywhere + stamp date
    await client.query(
        `UPDATE qc_entry SET final_grade = $2 WHERE bobbin_no = $1`,
        [bobbin_no, tempGrade]
    );

    await client.query(
        `UPDATE qc_entry_temp SET final_grade = $2 WHERE bobbin_no = $1`,
        [bobbin_no, tempGrade]
    );

    await client.query(
        `UPDATE bobbin_entries
            SET final_grade = $2,
                final_grade_date = NOW()
          WHERE bobbin_no = $1`,
        [bobbin_no, tempGrade]
    );

    // If final grade is DCA1, upgrade product_type to G657A1250 across all tables
    // and queue the product-type movement as an MTM (309) transfer in the unified
    // transactions table for the SAP posting scheduler (mirrors qc_entry.service.js).
    if (tempGrade === 'DCA1') {
        const upgradedProductType = 'SMFG657A1250';

        // Capture the current product_type BEFORE the upgrade so we can record
        // the movement (existing -> new) in transactions. Also grab fiber_length
        // to store as the moved quantity (qty).
        const existingRes = await client.query(
            `SELECT product_type, fiber_length FROM bobbin_entries WHERE bobbin_no = $1`,
            [bobbin_no]
        );
        const existingProductType = existingRes.rows[0]?.product_type ?? null;
        const combinedProductType = existingProductType
            ? `SMF${existingProductType}`
            : 'SMF';
        const qty = existingRes.rows[0]?.fiber_length ?? null;

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

        // ud_type 'UD6' tags this MTM row so it's clear which follow-up lane
        // it will queue on success (see queueMtmFollowUpUd).
        await client.query(
            `INSERT INTO transactions (
                type, comp_material_code, issg_or_rcvg_material,
                comp_batch, comp_quantity, ud_required, ud_type, status, created_at
            ) VALUES ('MTM', $1, $2, $3, $4, false, 'UD6', false, current_timestamp)`,
            [combinedProductType, upgradedProductType, bobbin_no, qty]
        );
    }

    return {
        bobbin_no,
        status: 'success',
        message: 'Final grade submitted successfully',
        final_grade: tempGrade,
    };
};

/**
 * Single bobbin final-grade promotion.
 * @param {string} bobbin_no
 */
export const submitQcFinalGradeS = async (bobbin_no) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await processFinalGradePromotion(client, bobbin_no);

        if (result.status === 'success') {
            await client.query('COMMIT');
            return { success: true, ...result };
        }

        await client.query('ROLLBACK');
        return { success: false, ...result };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Bulk final-grade promotion — each bobbin_no processed independently in its
 * own transaction so one failure never aborts the batch.
 * @param {string[]} bobbin_nos
 * @returns {Promise<{ summary: object, results: object[] }>}
 */
export const submitQcFinalGradeBulkS = async (bobbin_nos) => {
    const results = [];

    for (const rawBobbinNo of bobbin_nos) {
        const bobbin_no = String(rawBobbinNo).trim().toUpperCase();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const result = await processFinalGradePromotion(client, bobbin_no);

            if (result.status === 'success') {
                await client.query('COMMIT');
            } else {
                await client.query('ROLLBACK');
            }

            results.push(result);
        } catch (error) {
            await client.query('ROLLBACK');
            results.push({ bobbin_no, status: 'error', message: error.message || 'Unexpected error' });
        } finally {
            client.release();
        }
    }

    const summary = {
        total: results.length,
        success: results.filter((r) => r.status === 'success').length,
        error: results.filter((r) => r.status === 'error').length,
    };

    return { summary, results };
};
