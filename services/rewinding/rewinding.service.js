import pool from "../../db/postgres.js";

export const scanForRewindingS = async (bobbin_no) => {
    // Find pending fg_rewind
    const fgResult = await pool.query(
        `SELECT * FROM fg_rewind WHERE bobbin_no = $1 AND is_done = FALSE LIMIT 1`,
        [bobbin_no]
    );

    if (fgResult.rows.length === 0) {
        return { success: false, message: "No pending rewinding request found." };
    }

    // Get instructions
    const instrResult = await pool.query(
        `SELECT * FROM rewind_instr WHERE bobbin_no = $1 ORDER BY rewind_instr_id`,
        [bobbin_no]
    );

    // Get history
    const historyResult = await pool.query(
        `SELECT * FROM rewinding_entry WHERE bobbin_no = $1 ORDER BY created_at DESC`,
        [bobbin_no]
    );

    return {
        success: true,
        data: {
            fg_rewind: fgResult.rows[0],
            instructions: instrResult.rows,
            history: historyResult.rows
        }
    };
};

export const saveRewindingS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            bobbin_no, fg_rewind_id, fiber_length, is_scrap,
            generated_fid, machine_no, rew_reason, rew_type,
            bobbin_type, operator, bobbin_color, remark,
            selected_instructions, logged_in_user
        } = payload;

        // Step 1: Validate balance
        const fgResult = await client.query(
            `SELECT balance_length, total_length, last_child_fid, count, bobbin_fid
             FROM fg_rewind WHERE fg_rewind_id = $1 AND is_done = FALSE`,
            [fg_rewind_id]
        );

        if (fgResult.rows.length === 0) {
            throw new Error("Rewinding request not found or already completed.");
        }

        const fg = fgResult.rows[0];
        const available = fg.balance_length !== null ? Number(fg.balance_length) : Number(fg.total_length);
        const remaining = available - Number(fiber_length || 0);

        if (remaining < 0) {
            throw new Error("Entered length exceeds available balance length.");
        }

        // Step 2: Validate FID uniqueness
        const hasNewFid = generated_fid && generated_fid !== '';
        if (hasNewFid) {
            const fidCheck = await client.query(
                `SELECT fid FROM bobbin_entries WHERE fid = $1`,
                [generated_fid]
            );
            if (fidCheck.rows.length > 0) {
                throw new Error("Generated FID already exists.");
            }
        }

        // Step 3: Insert rewinding_entry
        await client.query(
            `INSERT INTO rewinding_entry (
                bobbin_no, fiber_length, is_scrap,fid,
                machine_no, rew_reason, rew_type, bobbin_type, operator,
                bobbin_colour, remark, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [bobbin_no, fiber_length, is_scrap || false,
             generated_fid || null, machine_no, rew_reason, rew_type,
             bobbin_type, operator, bobbin_color, remark, logged_in_user]
        );

        // Step 4: Update fg_rewind
        const isDone = remaining === 0;

        await client.query(
            `UPDATE fg_rewind SET
                balance_length = $1,
                is_done = $2,
                last_child_fid = CASE WHEN $3::text != '' THEN $3 ELSE last_child_fid END,
                count = CASE WHEN $3::text != '' THEN count + 1 ELSE count END
             WHERE fg_rewind_id = $4`,
            [remaining, isDone, generated_fid || '', fg_rewind_id]
        );

        // Step 5: Mark selected instructions as done
        if (selected_instructions && selected_instructions.length > 0) {
            await client.query(
                `UPDATE rewind_instr SET is_done = TRUE WHERE rewind_instr_id = ANY($1)`,
                [selected_instructions]
            );
        }

        // Step 6: Create child bobbin (only if FID generated and NOT scrap)
        if (hasNewFid && !is_scrap) {
            const parentResult = await client.query(
                `SELECT spool_id, tower_no, preform_id, fiber_type, spool_fid, preform_type,
                        product_type, pt_machine_no, drawn_length, drawn_date, pt_date, fiber_color
                 FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin_no]
            );

            if (parentResult.rows.length > 0) {
                const parent = parentResult.rows[0];
                await client.query(
                    `INSERT INTO bobbin_entries (
                        bobbin_no, fid, fiber_length, fiber_color, operator, logged_in_user,
                        spool_id, tower_no, preform_id, fiber_type, spool_fid, preform_type,
                        product_type, pt_machine_no, drawn_length, drawn_date, pt_date
                    ) VALUES ($1,$2,$3::numeric,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
                    [
                        bobbin_no,
                        generated_fid,
                        Number(fiber_length),
                        parent.fiber_color,
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
                        parent.pt_date
                    ]
                );
            }
        }

        await client.query("COMMIT");

        // Get updated data
        const historyResult = await pool.query(
            `SELECT * FROM rewinding_entry WHERE bobbin_no = $1 ORDER BY created_at DESC`,
            [bobbin_no]
        );
        const instrResult = await pool.query(
            `SELECT * FROM rewind_instr WHERE bobbin_no = $1 ORDER BY rewind_instr_id`,
            [bobbin_no]
        );

        const msg = remaining > 0
            ? `Rewinding Entry saved. ${remaining.toFixed(3)} KM still pending.`
            : `Rewinding Entry saved. Rewinding complete.`;

        return { success: true, message: msg, data: { history: historyResult.rows, instructions: instrResult.rows } };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
