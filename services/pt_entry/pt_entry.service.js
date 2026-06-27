import pool from "../../db/postgres.js";

export const ptEntryS = async(payload)=>{
    const client = await pool.connect();

    try{

        await client.query("BEGIN");

        const query = `
        INSERT INTO pt_entry(
        bobbin_no,
        spool_id,
        pt_date,
        fid,
        pt_machine_id,
        operator_id,
        shift_incharge_id,
        bobbin_color_id,
        bobbin_type_id,
        running_strain,
        product_type_id,
        pt_done_length,
        payoff_vibration,
        dancer_vibration,
        balance_length,
        logged_in_user
    )
        VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
        )
        RETURNING *;
        `;

        const entryValues = [
            payload.bobbin_no,
            payload.spool_id,
            payload.pt_date || new Date(),
            payload.fid,
            payload.pt_machine_id,
            payload.operator_id,
            payload.shift_incharge_id,
            payload.bobbin_color_id,
            payload.bobbin_type_id,
            payload.running_strain,
            payload.product_type_id,
            payload.pt_done_length,
            payload.payoff_vibration,
            payload.dancer_vibration,
            payload.balance_length,
            1111
        ];

        const ptEntry = await client.query(query,entryValues);

        const hasRejection = 
        payload.rejection ===true ||
        payload.bal_draw_rejection === true ||
        payload.multiple_end === true ||
        payload.scratch === true ||
        payload.pt_scrap === true ||
        payload.ztmd ===true ||
        payload.doc === true;

        if (hasRejection){
            const rejectionQuery = `
            INSERT INTO pt_rejection
                    bobbin_no,
                    rejection,
                    rejection_reason,
                    bal_draw_rejection,
                    bal_draw_rejection_reason,
                    multiple_end,
                    multiple_end_length,
                    scratch,
                    scratch_length,
                    pt_scrap,
                    pt_scrap_length,
                    ztmd,
                    ztmd_id,
                    doc,
                    doc_id)
                    VALUES (
                   $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
                 )
                   RETURNING *;
                   `;
                   await client.query(rejectionQuery, [
                payload.bobbin_no,
                payload.rejection || false,
                payload.rejection_reason || null,
                payload.bal_draw_rejection || false,
                payload.bal_draw_rejection_reason || null,
                payload.multiple_end || false,
                payload.multiple_end_length || null,
                payload.scratch || false,
                payload.scratch_length || null,
                payload.pt_scrap || false,
                payload.pt_scrap_length || null,
                payload.ztmd || false,
                payload.ztmd_id || null,
                payload.doc || false,
                payload.doc_id || null
            ]);
        }

        await client.query("COMMIT")

        return ptEntry.rows[0];

    }catch(error){
        await client.query("ROLLBACK");
        throw new Error(error.message);
    }finally{
        client.release();
    }
}


export const getSpoolDetailsForPtEntryS = async(spool_id)=>{
     const query = `
    SELECT
        pa.*,
        de.*
    FROM pt_allocation pa
    INNER JOIN draw_entry de
        ON pa.spool_id = de.spool_id
    WHERE pa.spool_id = $1
    LIMIT 1;
  `;

  const result = await pool.query(query, [spool_id]);
  if (result.rows.length === 0) {
    throw new Error("This spool is not allocated for PT.");
  }

  return result.rows[0];

}