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
            pob.bobbin_no, pob.length_km, pob.box_no, pob.stack_no,
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
