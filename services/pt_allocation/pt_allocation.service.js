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
            FOR UPDATE
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
        RETURNING *;
        `;

        const result = await client.query(insertQuery, [
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
            1111,
            payload.is_reject
        ]);

        // 🔵 STEP 3: UPDATE MACHINE
        await client.query(`
            UPDATE pt_machine
            SET is_active = false
            WHERE pt_machine_id = $1
        `, [payload.pt_machine_id]);

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
        throw new Error(error.message);
    } finally {
        client.release();
    }
};  


export const getPTAllocatedSpoolS = async (is_pt_complete) => {
    try {
        const query = `
            SELECT
                pta.*,

                pu1.pt_user_name AS allocated_by_name,
                pu2.pt_user_name AS shift_incharge_name,

                pm.pt_machine_no

            FROM pt_allocation pta

            LEFT JOIN pt_users pu1
                ON pta.allocated_by_id = pu1.pt_user_id

            LEFT JOIN pt_users pu2
                ON pta.shift_incharge_id = pu2.pt_user_id

            LEFT JOIN pt_machine pm
                ON pta.pt_machine_id = pm.pt_machine_id

            WHERE pta.is_pt_complete = $1

            ORDER BY pta.created_at DESC;
        `;

        const result = await pool.query(query, [is_pt_complete]);

        return result.rows;
    } catch (error) {
        throw new Error(error.message);
    }
};