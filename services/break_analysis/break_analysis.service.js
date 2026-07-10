import pool from "../../db/postgres.js";

export const getPendingBreaksS = async () => {
    const drawPending = await pool.query(
        `SELECT DISTINCT de.spool_fid as fid FROM draw_entry de
         WHERE LOWER(de.indication_fiber_cut) = 'break'
         AND de.spool_fid IS NOT NULL AND de.spool_fid != ''
         AND de.spool_fid NOT IN (SELECT fiber_id FROM draw_break_analysis WHERE fiber_id IS NOT NULL)
         ORDER BY de.spool_fid`
    );

    const ptPending = await pool.query(
        `SELECT DISTINCT pe.fid FROM pt_entry pe
         WHERE pe.is_break = true
         AND pe.fid IS NOT NULL AND pe.fid != ''
         AND pe.fid NOT IN (SELECT fiber_id FROM pt_break_analysis WHERE fiber_id IS NOT NULL)
         ORDER BY pe.fid`
    );

    return {
        drawPending: drawPending.rows.map(r => r.fid),
        ptPending: ptPending.rows.map(r => r.fid)
    };
};

export const getBobbinByFidS = async (fid) => {
    // Check draw_entry first (using spool_fid)
    const drawResult = await pool.query(
        `SELECT * FROM draw_entry WHERE spool_fid = $1 AND LOWER(indication_fiber_cut) = 'break' LIMIT 1`,
        [fid]
    );

    if (drawResult.rows.length > 0) {
        return {
            success: true,
            data: { ...drawResult.rows[0], source: 'DRAW' }
        };
    }

    // Check pt_entry
    const ptCheck = await pool.query(
        `SELECT fid FROM pt_entry WHERE fid = $1 AND is_break = true LIMIT 1`,
        [fid]
    );

    if (ptCheck.rows.length > 0) {
        // Fetch from bobbin_entries
        const bobbinResult = await pool.query(
            `SELECT fid, bobbin_no, spool_id, spool_fid, tower_no, pt_machine_no,
                    fiber_length, drawn_length, drawn_date, pt_date, operator,
                    fiber_type, fiber_color, product_type, preform_type,
                    temp_grade, final_grade
             FROM bobbin_entries WHERE fid = $1 LIMIT 1`,
            [fid]
        );

        if (bobbinResult.rows.length > 0) {
            return {
                success: true,
                data: { ...bobbinResult.rows[0], source: 'PT' }
            };
        }
    }

    return { success: false, message: "FID not found in pending breaks." };
};

export const saveBreakAnalysisS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            fiber_id, source, machine_no, break_length, break_type, break_category,
            break_remark, break_c_by, entry_done_by, main_break_type,
            sub_reason, next_sub_reason, dist_from_periphery, particle_size,
            flaw_size, bsa_remark, bsa_done_by, logged_in_user
        } = payload;

        // Step 1: Determine/verify source
        let resolvedSource = source;

        if (!resolvedSource) {
            const drawCheck = await client.query(
                `SELECT spool_fid FROM draw_entry WHERE spool_fid = $1 AND LOWER(indication_fiber_cut) = 'break' LIMIT 1`,
                [fiber_id]
            );
            if (drawCheck.rows.length > 0) {
                resolvedSource = 'DRAW';
            } else {
                const ptCheck = await client.query(
                    `SELECT fid FROM pt_entry WHERE fid = $1 AND is_break = true LIMIT 1`,
                    [fiber_id]
                );
                if (ptCheck.rows.length > 0) {
                    resolvedSource = 'PT';
                }
            }
        }

        if (!resolvedSource) {
            throw new Error("FID not found in pending breaks.");
        }

        // Step 2: Duplicate check
        const table = resolvedSource === 'DRAW' ? 'draw_break_analysis' : 'pt_break_analysis';

        const dupCheck = await client.query(
            `SELECT fiber_id FROM ${table} WHERE fiber_id = $1`,
            [fiber_id]
        );

        if (dupCheck.rows.length > 0) {
            throw new Error("Break Analysis already exists for this FID.");
        }

        // Step 3: Insert
        await client.query(
            `INSERT INTO ${table} (
                fiber_id, machine_no, break_length, break_type, break_category,
                break_remark, break_c_by, entry_done_by, main_break_type,
                sub_reason, next_sub_reason, dist_from_pheriphery, particle_size,
                flaw_size, bsa_remark, bsa_done_by, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
            [
                fiber_id, machine_no || null, break_length || null, break_type || null, break_category || null,
                break_remark || null, break_c_by || null, entry_done_by || null, main_break_type || null,
                sub_reason || null, next_sub_reason || null, dist_from_periphery || null, particle_size || null,
                flaw_size || null, bsa_remark || null, bsa_done_by || null, logged_in_user
            ]
        );

        await client.query("COMMIT");

        return { success: true, message: "Break analysis saved successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
