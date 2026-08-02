import pool from "../../db/postgres.js";

// ═══════════════════════════════════════════════════════════════
// D2 ISSUE DRAFT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export const getDraftListS = async () => {
    const result = await pool.query(`
        SELECT
            d2_batch_id,
            chamber,
            d2_type,
            COUNT(*)::int as bobbin_count,
            MIN(created_at) as created_at
        FROM d2_issue_draft
        GROUP BY d2_batch_id, chamber, d2_type
        ORDER BY MIN(created_at) DESC
    `);
    return result.rows;
};

export const getDraftDetailsS = async (d2_batch_id) => {
    // Get bobbins with joined master data
    const result = await pool.query(`
        SELECT
            d.bobbin_no,
            d.bobbin_fid,
            d.d2_type,
            b.fiber_type,
            b.fiber_color,
            q.temp_grade,
            q.final_grade
        FROM d2_issue_draft d
        LEFT JOIN bobbin_entries b ON b.bobbin_no = d.bobbin_no
        LEFT JOIN qc_entry_temp q ON q.bobbin_no = d.bobbin_no
        WHERE d.d2_batch_id = $1
        ORDER BY d.created_at ASC
    `, [d2_batch_id]);

    if (result.rows.length === 0) {
        return null;
    }

    // Get header info from first row
    const headerResult = await pool.query(
        `SELECT d2_batch_id, chamber, d2_type FROM d2_issue_draft WHERE d2_batch_id = $1 LIMIT 1`,
        [d2_batch_id]
    );

    return {
        d2_batch_id: headerResult.rows[0].d2_batch_id,
        chamber: headerResult.rows[0].chamber,
        d2_type: headerResult.rows[0].d2_type,
        bobbins: result.rows
    };
};

export const saveDraftBobbinS = async ({ d2_batch_id, bobbin_fid, bobbin_no, chamber, d2_type }) => {
    // Check duplicate in SAME draft
    const sameDraft = await pool.query(
        `SELECT 1 FROM d2_issue_draft WHERE d2_batch_id = $1 AND bobbin_no = $2`,
        [d2_batch_id, bobbin_no]
    );
    if (sameDraft.rows.length > 0) {
        return { success: false, message: 'This bobbin is already in this draft' };
    }

    // Check duplicate in ANY OTHER active draft
    const otherDraft = await pool.query(
        `SELECT d2_batch_id FROM d2_issue_draft WHERE bobbin_no = $1 AND d2_batch_id != $2`,
        [bobbin_no, d2_batch_id]
    );
    if (otherDraft.rows.length > 0) {
        return {
            success: false,
            message: `This bobbin is already present in another active draft (Batch: ${otherDraft.rows[0].d2_batch_id}). Please complete or delete that draft first.`
        };
    }

    // Insert
    await pool.query(
        `INSERT INTO d2_issue_draft (d2_batch_id, bobbin_fid, bobbin_no, chamber, d2_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [d2_batch_id, bobbin_fid, bobbin_no, chamber, d2_type]
    );

    return { success: true, message: 'Bobbin saved to draft' };
};

export const removeDraftBobbinS = async (d2_batch_id, bobbin_no) => {
    const result = await pool.query(
        `DELETE FROM d2_issue_draft WHERE d2_batch_id = $1 AND bobbin_no = $2 RETURNING d2_draft_id`,
        [d2_batch_id, bobbin_no]
    );
    if (result.rows.length === 0) {
        return { success: false, message: 'Bobbin not found in draft' };
    }
    return { success: true, message: 'Bobbin removed from draft' };
};

export const deleteDraftS = async (d2_batch_id) => {
    await pool.query(
        `DELETE FROM d2_issue_draft WHERE d2_batch_id = $1`,
        [d2_batch_id]
    );
    return { success: true, message: 'Draft deleted' };
};
