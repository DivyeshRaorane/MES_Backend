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

        // 🔵 STEP 2: CHECK IF PREVIOUSLY DEALLOCATED (pt_machine_no = 0)
        const existingAllocation = await client.query(
            `SELECT pt_allocation_id FROM pt_allocation WHERE spool_id = $1 AND pt_machine_no = 0`,
            [payload.spool_id]
        );

        let result;

        if (existingAllocation.rows.length > 0) {
            // RE-ALLOCATION: Update existing record
            const updateQuery = `
            UPDATE pt_allocation SET
                allocation_date = $1,
                pt_strain = $2,
                pt_machine_no = $3,
                allocated_by = $4,
                shift_incharge = $5,
                allocation_remark = $6,
                logged_in_user = $7,
                is_reject = $8
            WHERE spool_id = $9 AND pt_machine_no = 0
            RETURNING *;
            `;

            result = await client.query(updateQuery, [
                payload.allocation_date,
                payload.pt_strain,
                payload.pt_machine_no,
                payload.allocated_by,
                payload.shift_incharge,
                payload.allocation_remark,
                payload.logged_in_user,
                payload.is_reject,
                payload.spool_id
            ]);
        } else {
            // FRESH ALLOCATION: Insert new record
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

            result = await client.query(insertQuery, [
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

            // Only create mat_stock on fresh allocation
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
                p_count,
                last_fid
                )
                VALUES($1,$2,$3,$4,$5,$6,$7,$8)
                `,
                [mCode,payload.spool_id,"KM","PT Allocation",payload.drawn_length,payload.drawn_length,0,payload.spool_fid]
            )
        }

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
            WHERE pa.is_pt_complete = $1
            AND pa.pt_machine_no > 0
            ORDER BY pa.created_at DESC;
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

export const deallocatePtS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { spool_id, pt_machine_no } = payload;

        // STEP 1: Set pt_machine_no = 0 in pt_allocation (marks as deallocated)
        await client.query(
            `UPDATE pt_allocation SET pt_machine_no = 0 WHERE spool_id = $1 AND pt_machine_no = $2`,
            [spool_id, pt_machine_no]
        );

        // STEP 2: Free the PT machine (set is_active = true)
        await client.query(
            `UPDATE pt_machine SET is_active = true WHERE pt_machine_no = $1`,
            [pt_machine_no]
        );

        // STEP 3: Mark draw_entry as not allocated (goes back to pending/WIP list)
        await client.query(
            `UPDATE draw_entry SET is_pt_allocate = false WHERE spool_id = $1`,
            [spool_id]
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "PT Allocation deallocated successfully",
            spool_id
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(error.message);
    } finally {
        client.release();
    }
}