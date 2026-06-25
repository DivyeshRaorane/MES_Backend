import pool from "../../db/postgres.js";

export const createPtAllocationS = async (payload) => {
    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const query = `
        INSERT INTO pt_allocation(
        spool_id,
        allocation_date,
        preform_id,
        tower_id,
        drawn_length,
        product_type,
        pt_strain,
        pt_machine_id,
        allocated_by_id,
        shift_incharge_id,
        allocation_remark,
        logged_in_user,
        is_reject)
        VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        )
        RETURNING *;`;

        const result = await client.query(query, [
            payload.spool_id,
            payload.allocation_date,
            payload.preform_id,
            payload.tower_id,
            payload.drawn_length,
            payload.product_type,
            payload.pt_strain,
            payload.pt_machine_id,
            payload.allocated_by_id,
            payload.shift_incharge_id,
            payload.allocation_remark,
            payload.logged_in_user,
            payload.is_reject
        ]);

        await client.query(`
            UPDATE pt_machine
            SET is_active= false
            WHERE pt_machine_id = $1
            `,
        [payload.pt_machine_id]
    );

    await client.query(`
        UPDATE draw_entry
        SET is_pt_allocate = true
        WHERE spool_id = $1
        `,
    [payload.spool_id]
)

await client.query("COMMIT");

return result.rows[0];
    }catch(error){
        await client.query("ROLLBACK");

        throw error
    }finally{
        client.release()
    }

    
}