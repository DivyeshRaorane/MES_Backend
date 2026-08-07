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
                logged_in_user,
                pt_flaw_remark,
                a_cut_flaw,
                no,
                full_check,
                is_sample,
                full_mbend
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37
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
            payload.pt_break || false,
            payload.logged_in_user,
            payload.pt_flaw_remark || null,
            payload.a_cut_flaw || null,
            payload.no || null,
            payload.full_check ?? false,
            payload.is_sample ?? false,
            payload.full_mbend ?? false,
        ];

        const ptResult = await client.query(ptEntryQuery, values);


        if (payload.pt_break === true) {
    const updateBreakCountQuery = `
        UPDATE draw_entry
        SET pt_break_count = COALESCE(pt_break_count, 0) + 1
        WHERE spool_id = $1
        RETURNING pt_break_count;
    `;

    await client.query(updateBreakCountQuery, [payload.spool_id]);
}

        //-------------------------
        // Update Material Stock
        // Always subtract pt_length from balance for ALL entry types
        // (good entries, flaw rejections, and all other rejection types)
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
            // No FID (rejection entries or other): only update balance_qty
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
                    pa.preform_vendor_id,
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
                    pt_strain,
                    preform_vendor_id
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
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
                    ptStrain,
                    extra.preform_vendor_id || null
                ]
            );
        }

        //-------------------------
        // Flaw Booking & Missed Logic
        //-------------------------

        // Step 1: Mark missed flaws (runs for ALL entry types)
        if (Array.isArray(payload.missed_flaws) && payload.missed_flaws.length > 0) {
            for (const mf of payload.missed_flaws) {
                await client.query(
                    `UPDATE pt_flaw_details SET status = 'MISSED', is_done = FALSE
                     WHERE pt_flaw_id = $1 AND is_done = FALSE AND status != 'MISSED'`,
                    [mf.pt_flaw_id]
                );
            }
        }

        // Step 2: Book flaw — ONLY when active_rejection_type === 'rejection'
        if (payload.active_rejection_type === 'rejection' && payload.booked_flaw && payload.booked_flaw.pt_flaw_id) {
            await client.query(
                `UPDATE pt_flaw_details SET status = 'BOOKED', is_done = TRUE
                 WHERE pt_flaw_id = $1 AND is_done = FALSE`,
                [payload.booked_flaw.pt_flaw_id]
            );
        }

        // Step 3: Auto-mark any additional missed flaws after this entry
        const ptDoneResult = await client.query(
            `SELECT COALESCE(SUM(pt_length::numeric), 0) as total_done FROM pt_entry WHERE spool_id = $1`,
            [payload.spool_id]
        );
        const totalPtDone = parseFloat(ptDoneResult.rows[0].total_done) || 0;

        await client.query(
            `UPDATE pt_flaw_details SET status = 'MISSED'
             WHERE spool_id = $1 AND is_done = FALSE AND status = 'PENDING'
             AND ($2::numeric > (pos1::numeric + 2.1))`,
            [payload.spool_id, totalPtDone]
        );

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

        // Determine is_last (when balance <= 0)
        // If current entry has FID → mark it as is_last
        // If current entry has NO valid FID (rejection) → find the last entry with valid FID and mark that as is_last
        const balanceCheck = await client.query(
            `SELECT balance_qty FROM mat_stock WHERE batch_id = $1`,
            [payload.spool_id]
        );
        if (balanceCheck.rows.length > 0 && Number(balanceCheck.rows[0].balance_qty) <= 0) {
            if (fid !== '') {
                // Current entry has valid FID — mark it as is_last
                await client.query(
                    `UPDATE pt_entry SET is_last = FALSE WHERE spool_id = $1 AND is_last = TRUE`,
                    [payload.spool_id]
                );
                await client.query(
                    `UPDATE pt_entry SET is_last = TRUE, full_check = TRUE WHERE pt_entry_id = $1`,
                    [currentId]
                );
            } else {
                // Current entry has NO valid FID — find the last bobbin created with valid FID and mark that as is_last
                const lastFidEntry = await client.query(
                    `SELECT pt_entry_id FROM pt_entry 
                     WHERE spool_id = $1 AND fid IS NOT NULL AND fid != '' 
                     ORDER BY pt_entry_id DESC LIMIT 1`,
                    [payload.spool_id]
                );
                if (lastFidEntry.rows.length > 0) {
                    const lastFidEntryId = lastFidEntry.rows[0].pt_entry_id;
                    await client.query(
                        `UPDATE pt_entry SET is_last = FALSE WHERE spool_id = $1 AND is_last = TRUE`,
                        [payload.spool_id]
                    );
                    await client.query(
                        `UPDATE pt_entry SET is_last = TRUE, full_check = TRUE WHERE pt_entry_id = $1`,
                        [lastFidEntryId]
                    );
                }
            }
        }

        //-------------------------
        // Auto PT Scrap on PT Break (0.180 KM)
        // Runs for ALL entry types when pt_break = true (including multiple_end).
        // The main entry (multiple_end, good, etc.) is already fully saved above.
        // We only insert the 0.180 km scrap row — we do NOT touch before_rejection
        // or pending_after_rejection here because the rejection block above already
        // handled those correctly for whatever active_rejection_type was set.
        //-------------------------

        let autoScrapBooked = false;

        if (payload.pt_break === true && !payload.auto_pt_break_scrap) {
            // Check current balance after main entry to decide scrap amount
            const currentBalResult = await client.query(
                `SELECT balance_qty FROM mat_stock WHERE batch_id = $1`,
                [payload.spool_id]
            );
            const currentBalance = Number(currentBalResult.rows[0]?.balance_qty) || 0;

            // If balance is already 0, don't book any scrap — spool end popup will show on frontend
            if (currentBalance > 0) {
                // If balance < 0.180, book only the remaining balance as scrap
                const scrapLength = currentBalance < 0.180 ? Number(currentBalance.toFixed(3)) : 0.180;

                // Get next 'no' for the spool
                const noResult = await client.query(
                    `SELECT COALESCE(MAX(no), 0) + 1 as next_no FROM pt_entry WHERE spool_id = $1`,
                    [payload.spool_id]
                );
                const nextNo = noResult.rows[0].next_no;

                // Insert auto PT Scrap entry
                await client.query(`
                    INSERT INTO pt_entry (
                        spool_id, preform_id, drawn_length, tower_no, drawn_date,
                        pt_entry, fid, bobbin_no, spool_status, pt_machine,
                        operator_name, shift_incharge, bobbin_color, bobbin_type,
                        pt_length, status, payoff_vibration, dancer_vibration,
                        rejection, rejection_reason, bal_draw_rejection, bal_draw_rejection_reason,
                        multiple_end, scratch, pt_scrap, ztmd, ztmd_id, doc, doc_id,
                        is_break, logged_in_user, pt_flaw_remark, a_cut_flaw,
                        no, full_check, is_sample, full_mbend
                    ) VALUES (
                        $1, $2, $3, $4, $5,
                        $6, NULL, NULL, $7, $8,
                        $9, $10, NULL, NULL,
                        $11, $12, $13, $14,
                        TRUE, NULL, FALSE, NULL,
                        FALSE, FALSE, TRUE, FALSE, NULL, FALSE, NULL,
                        TRUE, $15, NULL, NULL,
                        $16, FALSE, FALSE, FALSE
                    )
                `, [
                    payload.spool_id,
                    payload.preform_id,
                    payload.drawn_length === "" ? null : Number(payload.drawn_length),
                    payload.tower_no === "" ? null : Number(payload.tower_no),
                    payload.drawn_date,
                    new Date(Date.now() + 1000), // 1 second after main entry to ensure correct ordering
                    payload.spool_status || null,
                    payload.pt_machine_no === "" ? null : Number(payload.pt_machine_no),
                    payload.operator_name || null,
                    payload.shift_incharge || null,
                    scrapLength,
                    payload.status,
                    payload.payoff_vibration,
                    payload.dancer_vibration,
                    payload.logged_in_user,
                    nextNo
                ]);

                // Subtract scrap length from stock
                await client.query(
                    `UPDATE mat_stock SET balance_qty = balance_qty - $1 WHERE batch_id = $2`,
                    [scrapLength, payload.spool_id]
                );

                // Set start_length / end_length on the auto-scrap row
                const scrapEntryResult = await client.query(
                    `SELECT pt_entry_id FROM pt_entry
                     WHERE spool_id = $1 AND pt_scrap = TRUE AND no = $2`,
                    [payload.spool_id, nextNo]
                );
                const scrapEntryId = scrapEntryResult.rows[0]?.pt_entry_id;

                if (scrapEntryId) {
                    const scrapSumResult = await client.query(
                        `SELECT COALESCE(SUM(pt_length), 0)::numeric as total_done
                         FROM pt_entry WHERE spool_id = $1 AND pt_entry_id != $2`,
                        [payload.spool_id, scrapEntryId]
                    );
                    const scrapStart = Number(scrapSumResult.rows[0].total_done);
                    const scrapEnd = scrapStart + scrapLength;
                    await client.query(
                        `UPDATE pt_entry SET start_length = $1, end_length = $2 WHERE pt_entry_id = $3`,
                        [scrapStart, scrapEnd, scrapEntryId]
                    );
                }

                // Only update before_rejection / pending_after_rejection when the
                // main entry was a GOOD entry (has FID).
                // If the main entry was itself a rejection (e.g. multiple_end),
                // the rejection block above already handled these correctly — skip here.
                if (!payload.active_rejection_type) {
                    // Mark before_rejection on the last good FID entry
                    const lastFidScrap = await client.query(
                        `SELECT last_fid FROM mat_stock WHERE batch_id = $1`,
                        [payload.spool_id]
                    );
                    const scrapLastFid = lastFidScrap.rows[0]?.last_fid;
                    if (scrapLastFid) {
                        await client.query(
                            `UPDATE pt_entry SET before_rejection = 'PT_SCRAP' WHERE spool_id = $1 AND fid = $2 AND before_rejection IS NULL`,
                            [payload.spool_id, scrapLastFid]
                        );
                    }

                    // Store pending_after_rejection for next good entry
                    await client.query(
                        `UPDATE mat_stock SET pending_after_rejection = 'PT_SCRAP' WHERE batch_id = $1`,
                        [payload.spool_id]
                    );
                }

                // After auto scrap deduction, check if balance hit 0
                // Auto scrap has no FID, so if balance is now 0, find last entry with valid FID and mark as is_last
                const postScrapBalance = await client.query(
                    `SELECT balance_qty FROM mat_stock WHERE batch_id = $1`,
                    [payload.spool_id]
                );
                if (postScrapBalance.rows.length > 0 && Number(postScrapBalance.rows[0].balance_qty) <= 0) {
                    const lastFidEntryAfterScrap = await client.query(
                        `SELECT pt_entry_id FROM pt_entry 
                         WHERE spool_id = $1 AND fid IS NOT NULL AND fid != '' 
                         ORDER BY pt_entry_id DESC LIMIT 1`,
                        [payload.spool_id]
                    );
                    if (lastFidEntryAfterScrap.rows.length > 0) {
                        const lastFidEntryId = lastFidEntryAfterScrap.rows[0].pt_entry_id;
                        await client.query(
                            `UPDATE pt_entry SET is_last = FALSE WHERE spool_id = $1 AND is_last = TRUE`,
                            [payload.spool_id]
                        );
                        await client.query(
                            `UPDATE pt_entry SET is_last = TRUE, full_check = TRUE WHERE pt_entry_id = $1`,
                            [lastFidEntryId]
                        );
                    }
                }

                autoScrapBooked = true;
            }
            // If currentBalance <= 0: no scrap booked, autoScrapBooked stays false
            // Frontend will show spool end popup based on balance_qty <= 0
        }

        // ─── SAP Transaction Generation ───
        // Generate SAP transactions after successful PT entry save.
        // Requires product_type and process_type from the associated draw_entry.
        if (payload.pt_length && Number(payload.pt_length) > 0) {
            try {
                // Fetch draw_entry data needed for SAP (product_type, process_type, batches)
                const drawDataResult = await client.query(
                    `SELECT product_type, process_type, primary_batch, secondary_batch, preform_id
                     FROM draw_entry WHERE spool_id = $1 LIMIT 1`,
                    [payload.spool_id]
                );

                const drawData = drawDataResult.rows[0];

                if (drawData && drawData.product_type && drawData.process_type) {
                    const { generatePTSAPTransactions } = await import('../sap_transaction/sap_transaction.service.js');

                    const sapData = {
                        bobbin_no: payload.bobbin_no,
                        spool_id: payload.spool_id,
                        fid: payload.fid || null,
                        pt_length: payload.pt_length,
                        product_type: drawData.product_type,
                        process_type: drawData.process_type,
                        preform_batch: drawData.preform_id || null,
                        primary_coating_batch: drawData.primary_batch || null,
                        secondary_coating_batch: drawData.secondary_batch || null,
                    };

                    const sapResult = await generatePTSAPTransactions(sapData, client);
                    console.log('[PTEntry] SAP Transactions generated:', sapResult.transaction_no, '| Type:', sapResult.movement_type);
                }
            } catch (sapError) {
                // Log SAP error but do not block PT entry save
                console.error('[PTEntry] SAP Transaction generation failed:', sapError.message);
                throw sapError;
            }
        }

        //-------------------------
        // Commit
        //-------------------------

        await client.query("COMMIT");

        const result = ptResult.rows[0];
        if (autoScrapBooked) {
            result.auto_scrap_booked = true;
        }

        return result;

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
    SELECT pt_flaw_id, spool_id, reason, pos1, pos2, defect_length, actual_cutting,
           is_booked, is_done, status, flaw_remark
    FROM pt_flaw_details
    WHERE spool_id = $1
    ORDER BY pos1 ASC;
    `;

    const result = await pool.query(query,[spool_id]);

    return result.rows;
}

export const getPTLogsS = async(spool_id)=>{
    const query = `
    SELECT *,
        CASE
            WHEN bal_draw_rejection = TRUE THEN 'bal_draw_rejection'
            WHEN multiple_end = TRUE THEN 'multiple_end'
            WHEN scratch = TRUE THEN 'scratch'
            WHEN pt_scrap = TRUE THEN 'pt_scrap'
            WHEN ztmd = TRUE THEN 'ztmd'
            WHEN doc = TRUE THEN 'doc'
            WHEN rejection = TRUE THEN 'rejection'
            ELSE NULL
        END AS active_rejection_type
    FROM pt_entry
    WHERE spool_id = $1
    ORDER BY pt_entry_id ASC;
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
