import pool from "../../db/postgres.js";

export const createPtAllocationS = async (payload) => {
    
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 🔴 STEP 1: CHECK IF ALREADY ALLOCATED
        const checkQuery = `
            SELECT is_pt_allocate 
            FROM draw_entry 
            WHERE spool_id = $1
        `;

        const checkResult = await client.query(checkQuery, [payload.spool_id]);

        if (checkResult.rows.length === 0) {
            throw new Error("Spool not found");
        }

        if (checkResult.rows[0].is_pt_allocate === true) {
            throw new Error("Spool is already allocated");
        }

        // 🔵 STEP 2: INSERT PT ALLOCATION
        const insertQuery = `
        INSERT INTO pt_allocation(
        spool_id,
        allocation_date,
        preform_id,
        tower_no,
        drawn_length,
        product_type,
        pt_strain,
        pt_machine_no,
        allocated_by,
        shift_incharge,
        allocation_remark,
        logged_in_user,
        is_reject)
        VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        )
        RETURNING *;
        `;

        const result = await client.query(insertQuery, [
            payload.spool_id,
            payload.allocation_date,
            payload.preform_id,
            payload.tower_no,
            payload.drawn_length,
            payload.product_type,
            payload.pt_strain,
            payload.pt_machine_no,
            payload.allocated_by,
            payload.shift_incharge,
            payload.allocation_remark,
            payload.logged_in_user,
            payload.is_reject
        ]);

        const mCode = Math.floor(100000 + Math.random() * 900000);

        await client.query(
            `
            INSERT INTO mat_stock(
            m_code,
            batch_id,
            uom,
            activity,
            qty,
            balance_qty,
            p_count
            )
            VALUES($1,$2,$3,$4,$5,$6,$7)
            `,
            [mCode,payload.spool_id,"KM","PT Allocation",payload.drawn_length,payload.drawn_length,0]
        )

        // 🔵 STEP 3: UPDATE MACHINE
        await client.query(`
            UPDATE pt_machine
            SET is_active = false
            WHERE pt_machine_no = $1
        `, [payload.pt_machine_no]);

        // 🔵 STEP 4: MARK ALLOCATED
        await client.query(`
            UPDATE draw_entry
            SET is_pt_allocate = true
            WHERE spool_id = $1
        `, [payload.spool_id]);

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(error);
    } finally {
        client.release();
    }
};  


export const getPTAllocatedSpoolS = async (is_pt_complete) => {
    try {
        const query = `
            SELECT
                pa.*, 
                ms.m_code,
                ms.qty,
                ms.balance_qty
            FROM pt_allocation pa
            LEFT JOIN mat_stock ms
             ON ms.batch_id = pa.spool_id
            WHERE is_pt_complete = $1
            ORDER BY created_at DESC;
        `;

        const result = await pool.query(query, [is_pt_complete]);

        return result.rows;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const getPTRejectedSpoolS = async(is_reject)=>{
    try{
        const query = `
        SELECT * FROM pt_allocation
        WHERE is_reject = $1
        ORDER BY created_at DESC
        `;

        const result = await pool.query(query, [is_reject]);

        return result.rows
    }catch(error){
        throw new Error(error.message)
    }
}

export const ptWipS = async(is_pt_allocate)=>{
    try{
        const query = `
        SELECT * FROM draw_entry
        WHERE is_pt_allocate = $1
        ORDER BY created_at DESC
        `;

        const result = await pool.query(query,[is_pt_allocate]);

        return result.rows
    }catch(error){
        throw new Error(error.message)
    }
}