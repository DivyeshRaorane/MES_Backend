import pool from "../../db/postgres.js";

export const scanForColouringS = async (bobbin_no) => {
    // Find pending fg_color record
    const fgResult = await pool.query(
        `SELECT * FROM fg_color WHERE bobbin_no = $1 AND is_done = FALSE LIMIT 1`,
        [bobbin_no]
    );

    if (fgResult.rows.length === 0) {
        return { success: false, message: "No pending colouring request found for this bobbin." };
    }

    // Get colouring history
    const historyResult = await pool.query(
        `SELECT * FROM coloring_entry WHERE bobbin_no = $1 ORDER BY created_at DESC`,
        [bobbin_no]
    );

    return {
        success: true,
        data: {
            fg_color: fgResult.rows[0],
            history: historyResult.rows
        }
    };
};

export const saveColouringS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            bobbin_no, fg_color_id, original_color, require_color,
            color_batch_code, fiber_length, is_scrap, machine_no,
            die_change, generated_fid, bobbin_type, operator,
            bobbin_color, remark, logged_in_user
        } = payload;

        // Step 1: Validate balance
        const fgResult = await client.query(
            `SELECT balance_length, total_length, last_child_fid, count, bobbin_fid
             FROM fg_color WHERE fg_color_id = $1 AND is_done = FALSE`,
            [fg_color_id]
        );

        if (fgResult.rows.length === 0) {
            throw new Error("Colouring request not found or already completed.");
        }

        const fg = fgResult.rows[0];
        const available = fg.balance_length !== null ? Number(fg.balance_length) : Number(fg.total_length);
        const remaining = available - Number(fiber_length || 0);

        if (remaining < 0) {
            throw new Error("Entered length exceeds available balance length.");
        }

        // Validate FID uniqueness if provided
        if (generated_fid && generated_fid !== '') {
            const fidCheck = await client.query(
                `SELECT fid FROM bobbin_entries WHERE fid = $1`,
                [generated_fid]
            );
            if (fidCheck.rows.length > 0) {
                throw new Error("Generated FID already exists.");
            }
        }

        // Step 2: Insert coloring_entry
        await client.query(
            `INSERT INTO coloring_entry (
                bobbin_no, original_color, current_color, color_batch_code,
                fiber_length, is_scrap, machine_no, fid,
                bobbin_type, operator, bobbin_color, remark, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [bobbin_no, original_color, require_color, color_batch_code,
             fiber_length, is_scrap || false, machine_no, generated_fid || null,
             bobbin_type, operator, bobbin_color, remark, logged_in_user]
        );

        // Step 3: Update fg_color
        const isDone = remaining === 0;
        const hasNewFid = generated_fid && generated_fid !== '';

        await client.query(
            `UPDATE fg_color SET
                balance_length = $1,
                is_done = $2,
                last_child_fid = CASE WHEN $3::text != '' THEN $3 ELSE last_child_fid END,
                count = CASE WHEN $3::text != '' THEN count + 1 ELSE count END
             WHERE fg_color_id = $4`,
            [remaining, isDone, generated_fid || '', fg_color_id]
        );

        // Step 4: Create child bobbin (only if FID generated)
        if (hasNewFid) {
            const parentResult = await client.query(
                `SELECT spool_id, tower_no, preform_id, fiber_type, spool_fid, preform_type,
                        product_type, pt_machine_no, drawn_length, drawn_date, pt_date, preform_vendor_id
                 FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin_no]
            );

            if (parentResult.rows.length > 0) {
                const parent = parentResult.rows[0];
                await client.query(
                    `INSERT INTO bobbin_entries (
                        bobbin_no, fid, fiber_length, fiber_color, operator, logged_in_user,
                        spool_id, tower_no, preform_id, fiber_type, spool_fid, preform_type,
                        product_type, pt_machine_no, drawn_length, drawn_date, pt_date, preform_vendor_id
                    ) VALUES ($1,$2,$3::numeric,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
                    [
                        bobbin_no,
                        generated_fid,
                        Number(fiber_length),
                        require_color,
                        operator,
                        logged_in_user,
                        parent.spool_id,
                        parent.tower_no,
                        parent.preform_id,
                        parent.fiber_type,
                        parent.spool_fid,
                        parent.preform_type,
                        parent.product_type,
                        parent.pt_machine_no,
                        parent.drawn_length,
                        parent.drawn_date,
                        parent.pt_date,
                        parent.preform_vendor_id
                    ]
                );
            }
        }

        // Step 5: Update parent bobbin_entries fiber_color
        await client.query(
            `UPDATE bobbin_entries SET fiber_color = $1 WHERE bobbin_no = $2`,
            [require_color, bobbin_no]
        );

        await client.query("COMMIT");

        // Get updated history
        const historyResult = await pool.query(
            `SELECT * FROM coloring_entry WHERE bobbin_no = $1 ORDER BY created_at DESC`,
            [bobbin_no]
        );

        const msg = remaining > 0
            ? `Colour Entry saved. ${remaining.toFixed(3)} KM still pending.`
            : `Colour Entry saved. Colouring complete.`;

        return { success: true, message: msg, data: { history: historyResult.rows } };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


export const getJobCardsS = async () => {
    const result = await pool.query(
        `SELECT
            col_jcard_no,
            COUNT(*)::int AS total,
            SUM(CASE WHEN is_done::text = 'true' OR is_done::text = '1' THEN 1 ELSE 0 END)::int AS completed,
            SUM(CASE WHEN is_done::text != 'true' AND is_done::text != '1' OR is_done IS NULL THEN 1 ELSE 0 END)::int AS pending
         FROM fg_color
         WHERE col_jcard_no IS NOT NULL AND col_jcard_no::text != ''
         GROUP BY col_jcard_no
         ORDER BY MAX(created_at) DESC`
    );

    return { success: true, data: result.rows };
};

export const getJobCardBobbinsS = async (col_jcard_no) => {
    const result = await pool.query(
        `SELECT
            fg_color_id, bobbin_no, bobbin_fid, current_color, require_color,
            total_length, balance_length, is_done, request_by, "date", created_at, remark
         FROM fg_color
         WHERE col_jcard_no = $1
         ORDER BY created_at ASC`,
        [col_jcard_no]
    );

    return { success: true, data: result.rows };
};
