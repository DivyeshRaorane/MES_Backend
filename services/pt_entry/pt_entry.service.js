import pool from "../../db/postgres.js";

export const ptEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        //-------------------------
        // Rejection Flags
        //-------------------------

        const rejectionFlags = {
            bal_draw_rejection: false,
            multiple_end: false,
            scratch: false,
            pt_scrap: false,
            ztmd: false,
            doc: false,
        };

        if (
            payload.active_rejection_type &&
            rejectionFlags.hasOwnProperty(payload.active_rejection_type)
        ) {
            rejectionFlags[payload.active_rejection_type] = true;
        }

        const rejection = !!payload.active_rejection_type;

        //-------------------------
        // Insert into pt_entry
        //-------------------------

        const ptEntryQuery = `
            INSERT INTO pt_entry (
                spool_id,
                preform_id,
                drawn_length,
                tower_no,
                drawn_date,
                pt_entry,
                fid,
                bobbin_no,
                spool_status,
                pt_machine,
                operator_name,
                shift_incharge,
                bobbin_color,
                bobbin_type,
                pt_length,
                status,
                payoff_vibration,
                dancer_vibration,
                rejection,
                rejection_reason,
                bal_draw_rejection,
                bal_draw_rejection_reason,
                multiple_end,
                scratch,
                pt_scrap,
                ztmd,
                ztmd_id,
                doc,
                doc_id,
                is_break,
                logged_in_user
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
            )
            RETURNING *;
        `;

        const values = [
            payload.spool_id,
            payload.preform_id,
            payload.drawn_length === "" ? null : Number(payload.drawn_length),
            payload.tower_no === "" ? null : Number(payload.tower_no),
            payload.drawn_date,
            payload.pt_entry || new Date(),
            payload.fid || null,
            payload.bobbin_no || null,
            payload.spool_status || null,
            payload.pt_machine_no === "" ? null : Number(payload.pt_machine_no),
            payload.operator_name || null,
            payload.shift_incharge || null,
            payload.bobbin_color || null,
            payload.bobbin_type || null,
            payload.pt_length === "" ? null : Number(payload.pt_length),
            payload.status,
            payload.payoff_vibration,
            payload.dancer_vibration,

            rejection,
            rejection ? (payload.rejection_reason || null) : null,

            rejectionFlags.bal_draw_rejection,
            payload.bal_draw_rejection_reason || null,

            rejectionFlags.multiple_end,
            rejectionFlags.scratch,
            rejectionFlags.pt_scrap,
            rejectionFlags.ztmd,
            payload.ztmd_id || null,
            rejectionFlags.doc,
            payload.doc_id || null,
            payload.is_break || false,
            payload.logged_in_user,
        ];

        const ptResult = await client.query(ptEntryQuery, values);

        //-------------------------
        // Update Material Stock
        //-------------------------

        if (payload.fid) {
            // FID present: update balance, increment p_count, update last_fid
            const stockResult = await client.query(
                `
                UPDATE mat_stock
                SET balance_qty = balance_qty - $1,
                    p_count = p_count + 1,
                    last_fid = $3
                WHERE batch_id = $2
                RETURNING *;
                `,
                [
                    Number(payload.pt_length),
                    payload.spool_id,
                    payload.fid
                ]
            );

            if (stockResult.rowCount === 0) {
                throw new Error("Material stock not found.");
            }
        } else {
            // No FID: only update balance_qty
            const stockResult = await client.query(
                `
                UPDATE mat_stock
                SET balance_qty = balance_qty - $1
                WHERE batch_id = $2
                RETURNING *;
                `,
                [
                    Number(payload.pt_length),
                    payload.spool_id
                ]
            );

            if (stockResult.rowCount === 0) {
                throw new Error("Material stock not found.");
            }
        }

        //-------------------------
        // Check FID
        //-------------------------

        if (payload.fid) {
            const fidResult = await client.query(
                `
                SELECT fid
                FROM bobbin_entries
                WHERE fid = $1
                `,
                [payload.fid]
            );

            if (fidResult.rows.length > 0) {
                throw new Error("FID already exists.");
            }

            //-------------------------
            // Fetch extra fields from preform_accept and draw_entry
            //-------------------------

            const extraResult = await client.query(
                `
                SELECT 
                    pa.preform_type,
                    pa.product_type,
                    de.spool_fid,
                    de.preform_id,
                    de.process_type
                FROM draw_entry de
                LEFT JOIN preform_accept pa ON de.preform_id = pa.preform_id
                WHERE de.spool_id = $1
                `,
                [payload.spool_id]
            );

            const extra = extraResult.rows[0] || {};
            const combinedProductType = [extra.product_type, extra.process_type].filter(Boolean).map(s => s.trim()).join('');

            // Get pt_strain from pt_allocation
            const ptAllocResult = await client.query(
                `SELECT pt_strain FROM pt_allocation WHERE spool_id = $1 LIMIT 1`,
                [payload.spool_id]
            );
            const ptStrain = ptAllocResult.rows[0]?.pt_strain || null;

            //-------------------------
            // Insert Bobbin Entry
            //-------------------------

            await client.query(
                `
                INSERT INTO bobbin_entries (
                    fid,
                    spool_id,
                    bobbin_no,
                    tower_no,
                    pt_machine_no,
                    fiber_length,
                    drawn_date,
                    pt_date,
                    drawn_length,
                    operator,
                    logged_in_user,
                    preform_type,
                    product_type,
                    spool_fid,
                    preform_id,
                    fiber_color,
                    fiber_type,
                    pt_strain
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
                )
                `,
                [
                    payload.fid,
                    payload.spool_id,
                    payload.bobbin_no || null,
                    payload.tower_no,
                    payload.pt_machine_no,
                    Number(payload.pt_length),
                    payload.drawn_date,
                    payload.pt_entry || new Date(),
                    Number(payload.drawn_length),
                    payload.operator_name || null,
                    payload.logged_in_user,
                    extra.preform_type || null,
                    combinedProductType || null,
                    extra.spool_fid || null,
                    extra.preform_id || null,
                    "Natural",
                    extra.preform_type || null,
                    ptStrain
                ]
            );
        }

        if (
    payload.active_rejection_type === "rejection" &&
    payload.pt_flaws?.length > 0
) {
    const flawId = payload.pt_flaws[0].pt_flaw_id;

    await client.query(
        `
        UPDATE pt_flaw_details
        SET is_done = true
        WHERE pt_flaw_id = $1
        `,
        [flawId]
    );
}
        //-------------------------
        // Enhancement: start/end length, is_first, is_last, rejections
        //-------------------------

        const currentId = ptResult.rows[0].pt_entry_id;
        const ptLength = Number(payload.pt_length) || 0;
        const fid = payload.fid || '';
        const activeRejType = payload.active_rejection_type || '';

        // Calculate start_length & end_length
        const sumResult = await client.query(
            `SELECT COALESCE(SUM(pt_length), 0)::numeric as total_done FROM pt_entry WHERE spool_id = $1 AND pt_entry_id != $2`,
            [payload.spool_id, currentId]
        );
        const startLen = Number(sumResult.rows[0].total_done);
        const endLen = startLen + ptLength;

        await client.query(
            `UPDATE pt_entry SET start_length = $1, end_length = $2 WHERE pt_entry_id = $3`,
            [startLen, endLen, currentId]
        );

        // ── Determine rejection type string ──
        const isRejection = !!activeRejType || (!fid && !activeRejType);
        let rejectionType = null;

        if (isRejection) {
            if (activeRejType === 'rejection') {
                rejectionType = payload.rejection_reason || 'REJECTION';
            } else if (activeRejType === 'pt_scrap') {
                rejectionType = 'PT_SCRAP';
            } else if (activeRejType === 'multiple_end') {
                rejectionType = 'MULTIPLE_END';
            } else if (activeRejType === 'scratch') {
                rejectionType = 'SCRATCH';
            } else if (activeRejType === 'ztmd') {
                rejectionType = 'ZTMD';
            } else if (activeRejType === 'doc') {
                rejectionType = 'DOC';
            } else if (activeRejType === 'bal_draw_rejection') {
                rejectionType = 'BAL_DRAW_REJ';
            } else {
                rejectionType = 'PT_SCRAP';
            }
        }

        if (isRejection && rejectionType) {
            // ═══ THIS IS A REJECTION ENTRY ═══

            // STEP 1: Update ONLY the immediately previous PT entry (via mat_stock.last_fid)
            const lastFidResult = await client.query(
                `SELECT last_fid FROM mat_stock WHERE batch_id = $1`,
                [payload.spool_id]
            );
            const lastFid = lastFidResult.rows[0]?.last_fid;

            if (lastFid) {
                await client.query(
                    `UPDATE pt_entry SET before_rejection = $1 WHERE spool_id = $2 AND fid = $3 AND before_rejection IS NULL`,
                    [rejectionType, payload.spool_id, lastFid]
                );
            }

            // STEP 2: Store pending_after_rejection in mat_stock for the next good entry
            await client.query(
                `UPDATE mat_stock SET pending_after_rejection = $1 WHERE batch_id = $2`,
                [rejectionType, payload.spool_id]
            );

        } else if (fid !== '') {
            // ═══ THIS IS A NORMAL (GOOD) PT ENTRY WITH FID ═══

            // Check if there's a pending after_rejection
            const matStockPending = await client.query(
                `SELECT pending_after_rejection FROM mat_stock WHERE batch_id = $1`,
                [payload.spool_id]
            );
            const pendingRej = matStockPending.rows[0]?.pending_after_rejection;

            if (pendingRej) {
                // Mark THIS entry with after_rejection
                await client.query(
                    `UPDATE pt_entry SET after_rejection = $1 WHERE pt_entry_id = $2`,
                    [pendingRej, currentId]
                );
                // Clear the pending flag
                await client.query(
                    `UPDATE mat_stock SET pending_after_rejection = NULL WHERE batch_id = $1`,
                    [payload.spool_id]
                );
            }

            // Determine is_first (only for FID entries)
            const firstCheck = await client.query(
                `SELECT COUNT(*) as count FROM pt_entry WHERE spool_id = $1 AND is_first = TRUE`,
                [payload.spool_id]
            );
            if (firstCheck.rows[0].count === '0') {
                await client.query(
                    `UPDATE pt_entry SET is_first = TRUE WHERE pt_entry_id = $1`,
                    [currentId]
                );
            }
        }

        // Determine is_last (only for entries WITH FID, when balance <= 0)
        if (fid !== '') {
            const balanceCheck = await client.query(
                `SELECT balance_qty FROM mat_stock WHERE batch_id = $1`,
                [payload.spool_id]
            );
            if (balanceCheck.rows.length > 0 && Number(balanceCheck.rows[0].balance_qty) <= 0) {
                await client.query(
                    `UPDATE pt_entry SET is_last = FALSE WHERE spool_id = $1 AND is_last = TRUE`,
                    [payload.spool_id]
                );
                await client.query(
                    `UPDATE pt_entry SET is_last = TRUE WHERE pt_entry_id = $1`,
                    [currentId]
                );
            }
        }

        //-------------------------
        // Determine is_break from PT machine log
        //-------------------------

        let isBreak = false;
        if (fid !== '' && payload.bobbin_no) {
            await client.query('SAVEPOINT pt_machine_log_check');
            try {
                const machineLog = await client.query(
                    `SELECT set_length, real_length FROM pt_machine_logs WHERE spool_code_tu = $1 ORDER BY processed_at DESC LIMIT 1`,
                    [payload.bobbin_no]
                );

                if (machineLog.rows.length > 0) {
                    const setLength = Number(machineLog.rows[0].set_length) || 0;
                    const ptLengthMeters = ptLength * 1000;

                    if (setLength > 0 && ptLengthMeters < setLength) {
                        isBreak = true;
                    }
                }
                await client.query('RELEASE SAVEPOINT pt_machine_log_check');
            } catch (e) {
                await client.query('ROLLBACK TO SAVEPOINT pt_machine_log_check');
            }

            await client.query(
                `UPDATE pt_entry SET is_break = $1 WHERE pt_entry_id = $2`,
                [isBreak, currentId]
            );
        }

        //-------------------------
        // Commit
        //-------------------------

        await client.query("COMMIT");

        return ptResult.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === '23505' && error.constraint === 'pt_entry_bobbin_no_unique') {
            throw new Error(`Bobbin ${payload.bobbin_no} already added.`);
        }
        throw error;
    } finally {
        client.release();
    }
};

export const getSpoolDetailsForPtEntryS = async(spool_id)=>{
     const query = `
    SELECT
        pa.*,
        de.*,
        ms.qty,
        ms.balance_qty
    FROM pt_allocation pa
    INNER JOIN draw_entry de
        ON pa.spool_id = de.spool_id
    LEFT JOIN mat_stock ms
        ON ms.batch_id = pa.spool_id
    WHERE pa.spool_id = $1
    LIMIT 1;
  `;

  const result = await pool.query(query, [spool_id]);
  if (result.rows.length === 0) {
    throw new Error("This spool is not allocated for PT.");
  }

  return result.rows[0];

}


export const getPTFlawsS = async(spool_id)=>{
    const query = `
    SELECT * FROM pt_flaw_details
    WHERE spool_id = $1
    AND is_done = false
    ORDER BY pt_flaw_id ASC;
    `;

    const result = await pool.query(query,[spool_id]);

    return result.rows;
}

export const getPTLogsS = async(spool_id)=>{
    const query = `
    SELECT * FROM pt_entry
    WHERE spool_id = $1
    ORDER BY created_at ASC;
    `;

    const result = await pool.query(query,[spool_id]);

    return result.rows;
}

export const getFidBySpoolS = async(spool_id)=>{
    const query = `
    SELECT last_fid, p_count FROM mat_stock
    WHERE batch_id = $1
    `;

    const result = await pool.query(query,[spool_id]);

    if(result.rows.length === 0){
        throw new Error("Mat stock not found for this spool");
    }

    return result.rows[0];
}

export const spoolCompleteS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { spool_id, pt_machine_no } = payload;

        // Mark spool as PT complete
        await client.query(
            `UPDATE pt_allocation SET is_pt_complete = TRUE WHERE spool_id = $1`,
            [spool_id]
        );

        // Free the PT machine
        await client.query(
            `UPDATE pt_machine SET is_active = TRUE WHERE pt_machine_no = $1`,
            [pt_machine_no]
        );

        await client.query("COMMIT");

        return { success: true, message: "Spool marked as PT complete. Machine freed." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
