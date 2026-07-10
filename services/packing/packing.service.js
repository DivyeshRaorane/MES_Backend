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

    if (bobbin.dispatch_status && bobbin.dispatch_status !== '') {
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
