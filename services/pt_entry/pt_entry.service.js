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
            payload.rejection_reason || null,

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
                    de.preform_id
                FROM draw_entry de
                LEFT JOIN preform_accept pa ON de.preform_id = pa.preform_id
                WHERE de.spool_id = $1
                `,
                [payload.spool_id]
            );

            const extra = extraResult.rows[0] || {};

            //-------------------------
            // Insert Bobbin Entry
            //-------------------------

            await client.query(
                `
                INSERT INTO bobbin_entries (
                    fid,
                    spool_id,
                    bobbin_no,
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
                    fiber_type
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
                )
                `,
                [
                    payload.fid,
                    payload.spool_id,
                    payload.bobbin_no || null,
                    Number(payload.pt_length),
                    payload.drawn_date,
                    payload.pt_entry || new Date(),
                    Number(payload.drawn_length),
                    payload.operator_name || null,
                    payload.logged_in_user,
                    extra.preform_type || null,
                    extra.product_type || null,
                    extra.spool_fid || null,
                    extra.preform_id || null,
                    "Natural",
                    extra.preform_type || null
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
        // Commit
        //-------------------------

        await client.query("COMMIT");

        return ptResult.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
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