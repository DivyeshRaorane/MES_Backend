import pool from "../../db/postgres.js";

export const getPreformFroAllocationS = async (is_allocate) => {

    const query = `
    SELECT
      hj.*,
      pa.preform_weight, 
      pa.drawing_length,
      pa.preform_type,
      pa.product_type,
      ms.balance_qty
    FROM handle_join hj
    INNER JOIN preform_accept pa
      ON hj.preform_id = pa.preform_id
    LEFT JOIN mat_stock ms
      ON hj.preform_id = ms.batch_id 
    WHERE hj.is_allocate = $1;
  `;

    const result = await pool.query(query, [is_allocate])

    return result.rows;

}

export const preformAllocationEntryS = async (data) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Check tower status
        const towerResult = await client.query(
            `
            SELECT is_active
            FROM draw_tower
            WHERE tower_no = $1
            `,
            [data.tower_no]
        );

        if (towerResult.rows.length === 0) {
            const error = new Error("Tower not found");
            error.statusCode = 404;
            throw error;
        }

        if (towerResult.rows[0].is_active === false) {
            const error = new Error("Selected tower is already occupied");
            error.statusCode = 409;
            throw error;
        }

        // Check if allocation already exists
        const checkAllocation = await client.query(
            `
            SELECT allocation_id
            FROM preform_allocation
            WHERE preform_id = $1
            `,
            [data.preform_id]
        );

        let allocationResult;

        if (checkAllocation.rowCount > 0) {
            // UPDATE
            allocationResult = await client.query(
                `
                UPDATE preform_allocation
                SET
                    allocation_date = $2,
                    tower_no = $3,
                    shift = $4,
                    operator = $5,
                    preform_type = $6,
                    product_type = $7,
                    process_type = $8,
                    average_diameter = $9,
                    draw_instruction = $10,
                    process_remarks = $11,
                    logged_in_user = $12
                WHERE preform_id = $1
                RETURNING *;
                `,
                [
                    data.preform_id,
                    data.allocation_date,
                    data.tower_no,
                    data.shift,
                    data.operator,
                    data.preform_type,
                    data.product_type,
                    data.process_type,
                    data.average_diameter,
                    data.draw_instruction,
                    data.process_remarks,
                    data.logged_in_user,
                ]
            );
        } else {
            // INSERT
            allocationResult = await client.query(
                `
                INSERT INTO preform_allocation (
                    preform_id,
                    allocation_date,
                    tower_no,
                    shift,
                    operator,
                    preform_type,
                    product_type,
                    process_type,
                    average_diameter,
                    draw_instruction,
                    process_remarks,
                    logged_in_user
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
                )
                RETURNING *;
                `,
                [
                    data.preform_id,
                    data.allocation_date,
                    data.tower_no,
                    data.shift,
                    data.operator,
                    data.preform_type,
                    data.product_type,
                    data.process_type,
                    data.average_diameter,
                    data.draw_instruction,
                    data.process_remarks,
                    data.logged_in_user,
                ]
            );
        }

        // Mark tower as occupied
        await client.query(
            `
            UPDATE draw_tower
            SET is_active = false
            WHERE tower_no = $1
            `,
            [data.tower_no]
        );

        // Mark handle_join as allocated
        await client.query(
            `
            UPDATE handle_join
            SET is_allocate = true
            WHERE preform_id = $1
            `,
            [data.preform_id]
        );

        await client.query("COMMIT");

        return allocationResult.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const preformDeallocationS = async (allocation_id) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Get allocation details
        const allocationResult = await client.query(
            `SELECT preform_id, tower_no
             FROM preform_allocation
             WHERE allocation_id = $1`,
            [allocation_id]
        );

        if (allocationResult.rows.length === 0) {
            throw new Error("Allocation not found");
        }

        const { preform_id, tower_no } = allocationResult.rows[0];

        if (!tower_no) {
            throw new Error("Preform is already deallocated");
        }

        // Remove tower allocation
        await client.query(
            `UPDATE preform_allocation
             SET tower_no = 0
             WHERE allocation_id = $1`,
            [allocation_id]
        );

        // Make tower available again
        await client.query(
            `UPDATE draw_tower
             SET is_active = true
             WHERE tower_no = $1`,
            [tower_no]
        );

        // Mark handle join as not allocated
        await client.query(
            `UPDATE handle_join
             SET is_allocate = false
             WHERE preform_id = $1`,
            [preform_id]
        );

        await client.query("COMMIT");

        return {
            message: "Preform deallocated successfully"
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const recentAllocatedPreformsS = async () => {
    const query = `
    SELECT 
    pa.allocation_id,
    pa.preform_id,
    pfa.preform_weight,
    pa.tower_no,
    pa.allocation_date,
    ms.balance_qty
    FROM preform_allocation pa
    INNER JOIN preform_accept pfa
    ON pa.preform_id = pfa.preform_id
    LEFT JOIN mat_stock ms
      ON pa.preform_id = ms.batch_id
    WHERE pa.tower_no != '0'
    AND pa.preform_draw = false
    ORDER BY pa.created_at DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
}

export const preformsByTowersS = async (tower_id) => {
    const query = `
  SELECT 
      pa.allocation_id,
      pa.preform_id,
      pfa.preform_weight,
      pa.tower_no,
      pa.preform_type,
      pa.product_type,
      pa.process_type,
      pa.allocation_date,
      ms.balance_qty
    FROM preform_allocation pa
    INNER JOIN preform_accept pfa
      ON pa.preform_id = pfa.preform_id
    LEFT JOIN mat_stock ms
      ON pa.preform_id = ms.batch_id
    WHERE pa.tower_no = $1
      AND pa.preform_draw = false
    ORDER BY pa.created_at DESC;
  `;


    const result = await pool.query(query, [tower_id]);
    return result.rows;
}