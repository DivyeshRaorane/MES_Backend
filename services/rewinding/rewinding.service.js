import pool from "../../db/postgres.js";

export const scanForRewindingS = async (bobbin_no) => {
    
    // Step 1: Check if fg_rewind already exists
    let fgRewind = (await pool.query(`SELECT * FROM fg_rewind WHERE bobbin_no = $1 LIMIT 1`, [bobbin_no])).rows[0];
console.log("🔥 fgRewind query completed:", fgRewind);
    // If exists, check if already done
    if (fgRewind && fgRewind.is_rew_done === true) {
        return { success: false, message: "Rewinding has already been completed for this bobbin." };
    }

    let remark = null;

    // Step 2: If NOT exists → create it
    if (!fgRewind) {
        const bobbin = (await pool.query(`SELECT * FROM bobbin_entries WHERE bobbin_no = $1`, [bobbin_no])).rows[0];
        if (!bobbin) {
            return { success: false, message: "Bobbin not found." };
        }


console.log("this:", bobbin_no)
        // Check final_grade = REW from qc_entry (or qc_entry_temp)
        let finalGrade = null;
        const qcEntry = (await pool.query(`SELECT final_grade, remark FROM qc_entry WHERE bobbin_no = $1`, [bobbin_no])).rows[0];
        if (qcEntry?.final_grade) {
            finalGrade = qcEntry.final_grade;
            remark = qcEntry.remark;
            console.log("remark:", qcEntry)
        } else {
            const qcTemp = (await pool.query(`SELECT final_grade, remark FROM qc_entry_temp WHERE bobbin_no = $1`, [bobbin_no])).rows[0];
            if (qcTemp?.final_grade) {
                finalGrade = qcTemp.final_grade;
                remark = qcTemp.remark;
            }
        }

        if (finalGrade !== 'REW') {
            return { success: false, message: "This bobbin is not marked for rewinding." };
        }

        // Determine rewinding_type
        const rewType = remark && remark.includes('Cut from') ? 'CUT' : 'REWINDING';

        // Insert fg_rewind
        const insertResult = await pool.query(
            `INSERT INTO fg_rewind (bobbin_no, bobbin_fid, total_length, balance_length, rewinding_type, last_child_fid, count)
             VALUES ($1, $2, $3, $3, $4, NULL, 0) RETURNING *`,
            [bobbin_no, bobbin.fid, bobbin.fiber_length, rewType]
        );
        fgRewind = insertResult.rows[0];

        // Parse remark into rewind_instr rows (if CUT)
        if (remark && rewType === 'CUT') {
            const parts = remark.split(',').map(s => s.trim()).filter(Boolean);
            for (const part of parts) {
                const match = part.match(
    /Cut from ([\d.]+) km to ([\d.]+)\s*\(([^)]+)\)/i
);
                if (match) {
                    await pool.query(
                        `INSERT INTO rewind_instr (bobbin_no, p1, p2, instruction, is_done, logged_in_user)
                         VALUES ($1, $2, $3, $4, FALSE, 'system')`,
                        [bobbin_no, match[1], match[2], match[3]]
                    );
                }
            }
        }
    } else {
        // fg_rewind exists — get remark for reference
        const qcEntry = (await pool.query(`SELECT remark FROM qc_entry WHERE bobbin_no = $1`, [bobbin_no])).rows[0];
        if (qcEntry?.remark) remark = qcEntry.remark;
        else {
            const qcTemp = (await pool.query(`SELECT remark FROM qc_entry_temp WHERE bobbin_no = $1`, [bobbin_no])).rows[0];
            if (qcTemp?.remark) remark = qcTemp.remark;
        }
    }

    // Step 3: Get instructions (only pending)
    const instructions = (await pool.query(
        `SELECT * FROM rewind_instr WHERE bobbin_no = $1 AND is_done = FALSE ORDER BY rewind_instr_id ASC`,
        [bobbin_no]
    )).rows;

    // Step 4: Get history
    const history = (await pool.query(
        `SELECT * FROM rewinding_entry WHERE parent_bobbin_no = $1 ORDER BY created_at ASC`,
        [bobbin_no]
    )).rows;

    // Step 5: Get bobbin info
    const bobbin = (await pool.query(
        `SELECT bobbin_no, fid, fiber_length, fiber_color, fiber_type, spool_id, spool_fid,
                preform_id, tower_no, product_type, preform_type, operator
         FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    )).rows[0];

    // Step 6: Return response
    return {
        success: true,
        data: {
            bobbin,
            balance_length: fgRewind.balance_length,
            rew_record: {
                fg_rewind_id: fgRewind.fg_rewind_id,
                remark: remark || null,
                balance_length: fgRewind.balance_length,
                rewinding_type: fgRewind.rewinding_type,
                last_child_fid: fgRewind.last_child_fid,
                count: fgRewind.count
            },
            instructions,
            history
        }
    };
};

export const saveRewindingS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            bobbin_no, parent_bobbin_no, fiber_length, is_scrap,
            generated_fid, machine_no, rew_reason, rew_type,
            bobbin_type, operator, bobbin_color, remark,
            selected_instructions, logged_in_user
        } = payload;

        const trackBobbin = parent_bobbin_no || bobbin_no;

        // Step 1: Validate balance from fg_rewind
        const fgResult = await client.query(
            `SELECT balance_length, is_rew_done FROM fg_rewind WHERE bobbin_no = $1 LIMIT 1`,
            [trackBobbin]
        );

        if (fgResult.rows.length === 0) {
            throw new Error("Rewinding request not found.");
        }

        if (fgResult.rows[0].is_rew_done === true) {
            throw new Error("Rewinding has already been completed for this bobbin.");
        }

        const available = Number(fgResult.rows[0].balance_length) || 0;

        if (available <= 0) {
            throw new Error("Balance length is already 0. No further rewinding allowed.");
        }

        const remaining = available - Number(fiber_length || 0);

        if (remaining < 0) {
            throw new Error("Entered length exceeds available balance length.");
        }

        // Step 2: Validate FID uniqueness
        const hasNewFid = generated_fid && generated_fid.trim() !== '';
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
                parent_bobbin_no, bobbin_no, fiber_length, is_scrap, fid,
                machine_no, rew_reason, rew_type, bobbin_type, operator,
                bobbin_colour, remark, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [trackBobbin, bobbin_no, fiber_length, is_scrap || false,
             generated_fid || null, machine_no, rew_reason, rew_type,
             bobbin_type, operator, bobbin_color, remark, logged_in_user]
        );

        // Step 4: Update fg_rewind
        const isDone = remaining <= 0;

        if (hasNewFid) {
            await client.query(
                `UPDATE fg_rewind SET
                    balance_length = balance_length - $2,
                    count = count + 1,
                    last_child_fid = $3,
                    is_rew_done = $4
                 WHERE bobbin_no = $1`,
                [trackBobbin, fiber_length, generated_fid, isDone]
            );
        } else {
            // Scrap — just deduct balance
            await client.query(
                `UPDATE fg_rewind SET balance_length = balance_length - $2, is_rew_done = $3 WHERE bobbin_no = $1`,
                [trackBobbin, fiber_length, isDone]
            );
        }

        // If done, also update qc_entry and qc_entry_temp
        if (isDone) {
            await client.query(
                `UPDATE qc_entry SET is_rew_done = true WHERE bobbin_no = $1`,
                [trackBobbin]
            );
            await client.query(
                `UPDATE qc_entry_temp SET is_rew_done = true WHERE bobbin_no = $1`,
                [trackBobbin]
            );
        }

        // Step 5: If FID generated, insert child bobbin into bobbin_entries
        if (hasNewFid) {
            // Duplicate check
            const dupCheck = await client.query(
                `SELECT COUNT(*) as count FROM bobbin_entries WHERE bobbin_no = $1`,
                [bobbin_no]
            );
            if (Number(dupCheck.rows[0].count) > 0) {
                throw new Error("This bobbin_no already exists in bobbin entries.");
            }

            // Get parent data
            const parentData = await client.query(
                `SELECT spool_id, tower_no, preform_id, fiber_type, spool_fid, preform_type,
                        product_type, pt_machine_no, fiber_color, drawn_length, drawn_date, pt_date,preform_vendor_id
                 FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                [trackBobbin]
            );

            if (parentData.rows.length > 0) {
                const parent = parentData.rows[0];
                await client.query(
                    `INSERT INTO bobbin_entries (
                        bobbin_no, fid, fiber_length, fiber_color, operator, logged_in_user,
                        spool_id, tower_no, preform_id, fiber_type, spool_fid, preform_type,
                        product_type, pt_machine_no, drawn_length, drawn_date, pt_date,preform_vendor_id
                    ) VALUES ($1,$2,$3::numeric,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
                    [
                        bobbin_no, generated_fid, Number(fiber_length),
                        parent.fiber_color, operator, logged_in_user,
                        parent.spool_id, parent.tower_no, parent.preform_id,
                        parent.fiber_type, parent.spool_fid, parent.preform_type,
                        parent.product_type, parent.pt_machine_no,
                        parent.drawn_length, parent.drawn_date, parent.pt_date, parent.preform_vendor_id
                    ]
                );
            }
        }

        // Step 6: Mark selected instructions as done
        if (selected_instructions && selected_instructions.length > 0) {
            await client.query(
                `UPDATE rewind_instr SET is_done = TRUE WHERE rewind_instr_id = ANY($1)`,
                [selected_instructions]
            );
        }

        await client.query("COMMIT");

        // Get updated data
        const updatedFg = (await pool.query(`SELECT balance_length FROM fg_rewind WHERE bobbin_no = $1`, [trackBobbin])).rows[0];
        const updatedInstructions = (await pool.query(
            `SELECT * FROM rewind_instr WHERE bobbin_no = $1 AND is_done = FALSE ORDER BY rewind_instr_id ASC`,
            [trackBobbin]
        )).rows;
        const updatedHistory = (await pool.query(
            `SELECT * FROM rewinding_entry WHERE parent_bobbin_no = $1 ORDER BY created_at ASC`,
            [trackBobbin]
        )).rows;

        const msg = remaining > 0
            ? `Rewinding entry saved. ${remaining.toFixed(3)} KM still pending.`
            : `Rewinding entry saved. Rewinding complete.`;

        return {
            success: true,
            message: msg,
            data: {
                balance_length: updatedFg?.balance_length,
                instructions: updatedInstructions,
                history: updatedHistory
            }
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
