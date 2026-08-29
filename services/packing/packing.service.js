import pool from "../../db/postgres.js";

export const getOrderForPackingS = async (order_no) => {
    const result = await pool.query(
        `SELECT * FROM packing_order WHERE order_no = $1`,
        [order_no]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};

export const validateBobbinForPackingS = async (bobbin_no, order_no) => {
    // Check bobbin exists
    const bobbinResult = await pool.query(
        `SELECT bobbin_no, fiber_length, is_qc_out, dispatch_status
         FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinResult.rows.length === 0) {
        return { success: false, message: "Bobbin not found." };
    }

    const bobbin = bobbinResult.rows[0];

    if (bobbin.is_qc_out !== true) {
        return { success: false, message: "Bobbin is not QC Out." };
    }

    if (bobbin.dispatch_status !== "NO") {
        return { success: false, message: `Bobbin already has dispatch status: ${bobbin.dispatch_status}.` };
    }

    // Check not already packed in this order
    const packCheck = await pool.query(
        `SELECT packing_order_bobbin_id FROM packing_order_bobbin WHERE packing_order = $1 AND bobbin_no = $2`,
        [order_no, bobbin_no]
    );

    if (packCheck.rows.length > 0) {
        return { success: false, message: "Bobbin already packed in this order." };
    }

    return {
        success: true,
        data: {
            bobbin_no: bobbin.bobbin_no,
            fiber_length: bobbin.fiber_length
        }
    };
};

export const submitPackingS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { order_no, bobbins } = payload;

        // Validation: Check if this order is already packed
        const orderCheck = await client.query(
            `SELECT is_packed FROM packing_order WHERE order_no = $1`,
            [order_no]
        );

        if (orderCheck.rows.length === 0) {
            throw new Error("Packing order not found.");
        }

        if (orderCheck.rows[0].is_packed === true) {
            throw new Error("This packing order is already completed. Cannot pack again.");
        }

        for (const bobbin of bobbins) {
            await client.query(
                `INSERT INTO packing_order_bobbin (packing_order, bobbin_no, length_km, box_no, stack_no)
                 VALUES ($1, $2, $3, $4, $5)`,
                [order_no, bobbin.bobbin_no, bobbin.length_km, bobbin.box_no, bobbin.stack_no]
            );

            await client.query(
                `UPDATE bobbin_entries SET dispatch_status = 'PACKED' WHERE bobbin_no = $1`,
                [bobbin.bobbin_no]
            );

            // Check if this bobbin occupies a tray position; if so, delete that row.
            // If no tray_position row exists for this bobbin, skip.
            await client.query(
                `DELETE FROM tray_position WHERE bobbin_no = $1`,
                [bobbin.bobbin_no]
            );
        }

        // Mark packing order as packed
        await client.query(
            `UPDATE packing_order SET is_packed = TRUE, updated_at = CURRENT_TIMESTAMP WHERE order_no = $1`,
            [order_no]
        );

        await client.query("COMMIT");
        return { success: true, message: "Packing list saved successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === '23505') {
            const match = error.detail?.match(/bobbin_no.*?=(.*?)\)/);
            const dup = match ? match[1].trim() : 'unknown';
            throw new Error(`Bobbin ${dup} already packed in this order.`);
        }
        throw error;
    } finally {
        client.release();
    }
};

export const getPackingListHistoryS = async () => {
    const result = await pool.query(`
        SELECT
            po.order_no,
            po.customer_name,
            COUNT(pob.packing_order_bobbin_id) AS total_bobbins,
            COALESCE(SUM(pob.length_km), 0) AS total_km,
            MAX(pob.box_no) AS total_boxes,
            MAX(pob.stack_no) AS total_stacks,
            po.created_at
        FROM packing_order po
        LEFT JOIN packing_order_bobbin pob ON pob.packing_order = po.order_no
        GROUP BY po.order_no, po.customer_name, po.created_at
        HAVING COUNT(pob.packing_order_bobbin_id) > 0
        ORDER BY po.created_at DESC
    `);
    return result.rows;
};

export const getPackingListViewS = async (order_no) => {
    // Get order header
    const orderResult = await pool.query(
        `SELECT * FROM packing_order WHERE order_no = $1`,
        [order_no]
    );

    if (orderResult.rows.length === 0) {
        throw new Error("Packing order not found.");
    }

    // Get all bobbins packed in this order
    const bobbinResult = await pool.query(`
        SELECT
            pob.packing_order_bobbin_id, pob.bobbin_no, pob.length_km, pob.box_no, pob.stack_no,
            be.fid, be.fiber_length, be.product_type, be.spool_id, be.preform_id
        FROM packing_order_bobbin pob
        LEFT JOIN bobbin_entries be ON be.bobbin_no = pob.bobbin_no
        WHERE pob.packing_order = $1
        ORDER BY pob.box_no, pob.stack_no, pob.bobbin_no
    `, [order_no]);

    return {
        header: orderResult.rows[0],
        bobbins: bobbinResult.rows,
    };
};

export const deletePackingBobbinS = async (packing_order_bobbin_id) => {
    // Find the record first to get bobbin_no
    const existing = await pool.query(
        `SELECT * FROM packing_order_bobbin WHERE packing_order_bobbin_id = $1`,
        [packing_order_bobbin_id]
    );

    if (existing.rowCount === 0) {
        return { success: false, status: 404, message: "Bobbin record not found" };
    }

    const bobbin_no = existing.rows[0].bobbin_no;

    // Validate dispatch_status is PACKED before removing
    const bobbinEntry = await pool.query(
        `SELECT dispatch_status FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinEntry.rowCount > 0 && bobbinEntry.rows[0].dispatch_status !== 'PACKED') {
        return { success: false, status: 400, message: `Cannot remove bobbin. Dispatch status is '${bobbinEntry.rows[0].dispatch_status}', expected 'PACKED'.` };
    }

    // Delete from packing
    await pool.query(
        `DELETE FROM packing_order_bobbin WHERE packing_order_bobbin_id = $1`,
        [packing_order_bobbin_id]
    );

    // Reset dispatch_status to 'NO' in bobbin_entries
    await pool.query(
        `UPDATE bobbin_entries SET dispatch_status = 'NO' WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    return { success: true, message: "Bobbin removed and dispatch status reset" };
};

export const deletePackingBoxS = async (order_no, stack_no, box_no) => {
    // Find all bobbins in this box first
    const existing = await pool.query(
        `SELECT * FROM packing_order_bobbin WHERE packing_order = $1 AND stack_no = $2 AND box_no = $3`,
        [order_no, stack_no, box_no]
    );

    if (existing.rowCount === 0) {
        return { success: false, status: 404, message: "No bobbins found in this box" };
    }

    const bobbinNos = existing.rows.map(b => b.bobbin_no);

    // Validate all bobbins have dispatch_status = PACKED before removing
    const statusCheck = await pool.query(
        `SELECT bobbin_no, dispatch_status FROM bobbin_entries WHERE bobbin_no = ANY($1) AND dispatch_status != 'PACKED'`,
        [bobbinNos]
    );

    if (statusCheck.rowCount > 0) {
        return { success: false, status: 400, message: `Cannot remove box. Some bobbins do not have dispatch status 'PACKED'.` };
    }

    // Delete all bobbins in this box from packing
    await pool.query(
        `DELETE FROM packing_order_bobbin WHERE packing_order = $1 AND stack_no = $2 AND box_no = $3`,
        [order_no, stack_no, box_no]
    );

    // Reset dispatch_status to 'NO' in bobbin_entries for all removed bobbins
    await pool.query(
        `UPDATE bobbin_entries SET dispatch_status = 'NO' WHERE bobbin_no = ANY($1)`,
        [bobbinNos]
    );

    return {
        success: true,
        message: `Box ${box_no} removed. ${existing.rowCount} bobbin(s) deleted and dispatch status reset.`,
        removed_count: existing.rowCount
    };
};

export const addBobbinToPackingS = async (order_no, bobbin_no, stack_no, box_no) => {
    // Check if bobbin already exists in this packing list
    const existing = await pool.query(
        `SELECT * FROM packing_order_bobbin WHERE packing_order = $1 AND bobbin_no = $2`,
        [order_no, bobbin_no]
    );

    if (existing.rowCount > 0) {
        return { success: false, status: 400, message: "Bobbin already exists in this packing list" };
    }

    // Get bobbin details from bobbin_entries (validate it exists and get length)
    const bobbinData = await pool.query(
        `SELECT * FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinData.rowCount === 0) {
        return { success: false, status: 404, message: "Bobbin not found in system" };
    }

    // Validate dispatch_status is NO before adding
    if (bobbinData.rows[0].dispatch_status !== 'NO') {
        return { success: false, status: 400, message: `Cannot add bobbin. Dispatch status is '${bobbinData.rows[0].dispatch_status}', expected 'NO'.` };
    }

    // Check box capacity from packing_order
    const orderData = await pool.query(
        `SELECT box_capacity FROM packing_order WHERE order_no = $1`,
        [order_no]
    );

    if (orderData.rowCount === 0) {
        return { success: false, status: 404, message: "Packing order not found" };
    }

    const boxCapacity = orderData.rows[0].box_capacity;

    // Count current bobbins in the target box
    const boxCount = await pool.query(
        `SELECT COUNT(*) AS count FROM packing_order_bobbin WHERE packing_order = $1 AND stack_no = $2 AND box_no = $3`,
        [order_no, stack_no, box_no]
    );

    const currentCount = parseInt(boxCount.rows[0].count, 10);

    if (currentCount >= boxCapacity) {
        return { success: false, status: 400, message: `Box ${box_no} is full. Capacity is ${boxCapacity} bobbin(s), currently has ${currentCount}.` };
    }

    const length_km = bobbinData.rows[0].fiber_length || bobbinData.rows[0].length_km || 0;

    // Insert into packing_order_bobbin
    await pool.query(
        `INSERT INTO packing_order_bobbin (packing_order, bobbin_no, length_km, stack_no, box_no) VALUES ($1, $2, $3, $4, $5)`,
        [order_no, bobbin_no, length_km, stack_no, box_no]
    );

    // Update dispatch_status to 'PACKED' in bobbin_entries
    await pool.query(
        `UPDATE bobbin_entries SET dispatch_status = 'PACKED' WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    return { success: true, message: `Bobbin ${bobbin_no} added to Stack ${stack_no}, Box ${box_no}` };
};
