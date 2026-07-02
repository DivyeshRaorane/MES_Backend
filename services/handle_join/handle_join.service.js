import pool from "../../db/postgres.js";

export const getPreformForHandleJ = async(is_handle_join)=>{
const query = `
SELECT * FROM preform_accept
WHERE is_handle_join = $1`;

const result = await pool.query(query,[is_handle_join]);
return result.rows;
}

export const handleJoinS = async(payload)=>{
    const client = await pool.connect();

    try{
        await client.query("BEGIN");

        const query = `
        INSERT INTO handle_join
        (preform_id,
        dia1,dia2,dia3,dia4,dia5,
        h2flow1,h2flow2,h2flow3,
        o2line1_flow1, o2line1_flow2, o2line1_flow3,
         h2flow1_time, h2flow2_time, h2flow3_time,
         o2line1_flow1_time, o2line1_flow2_time, o2line1_flow3_time,
         h2flow1_cons, h2flow2_cons, h2flow3_cons,
         o2line1_flow1_cons, o2line1_flow2_cons, o2line1_flow3_cons,
         handle_length,
        handle_diameter,
        cone_length,
        handle_number,
        joined_by,
        additional_notes,
        logged_in_user
    )
        VALUES(
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,
        $10,$11,$12,
        $13,$14,$15,
        $16,$17,$18,
        $19,$20,$21,
        $22,$23,$24,
        $25,$26,$27,
        $28,$29,$30,$31
        )
        RETURNING *;
        `;

        const values = [
      payload.preform_id,
      payload.dia1, 
      payload.dia2, 
      payload.dia3, 
      payload.dia4, 
      payload.dia5,
      payload.h2flow1, 
      payload.h2flow2, 
      payload.h2flow3,
      payload.o2line1_flow1, 
      payload.o2line1_flow2, 
      payload.o2line1_flow3,
      payload.h2flow1_time, 
      payload.h2flow2_time, 
      payload.h2flow3_time,
      payload.o2line1_flow1_time, 
      payload.o2line1_flow2_time, 
      payload.o2line1_flow3_time,
      payload.h2flow1_cons, 
      payload.h2flow2_cons, 
      payload.h2flow3_cons,
      payload.o2line1_flow1_cons, 
      payload.o2line1_flow2_cons, 
      payload.o2line1_flow3_cons,
      payload.handle_length,
      payload.handle_diameter,
      payload.cone_length,
      payload.handle_number,
      payload.joined_by,
      payload.additional_notes,
      payload.logged_in_user
    ];

    const result = await client.query(query,values);

    await client.query(
        `UPDATE preform_accept
        SET is_handle_join = true
        WHERE preform_id = $1`,
        [payload.preform_id]
    );

    await client.query(
        `UPDATE mat_stock
        SET activity = 'Handle Join'
        WHERE batch_id = $1`,
    [payload.preform_id]
    );

    await client.query("COMMIT");

    return result.rows[0];

    }catch(error){
        await client.query("ROLLBACK")
        throw error
    }finally{
        client.release()
    }
}
