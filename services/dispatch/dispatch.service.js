import pool from "../../db/postgres.js";

export const getTcByNumberS = async (tc_number) => {
    // Fetch TC header
    const headerResult = await pool.query(
        `SELECT * FROM tc_header WHERE tc_number = $1 AND is_active = true`,
        [tc_number]
    );

    if (headerResult.rows.length === 0) {
        return { success: false, message: "TC not found" };
    }

    const header = headerResult.rows[0];

    // Fetch TC details
    const detailsResult = await pool.query(
        `SELECT * FROM tc_detail WHERE tc_id = $1`,
        [header.tc_id]
    );

    return { success: true, header, details: detailsResult.rows };
};

export const markDispatchedS = async (tc_id) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Get all bobbin_no from tc_detail for this tc_id
        const detailsResult = await client.query(
            `SELECT bobbin_no FROM tc_detail WHERE tc_id = $1`,
            [tc_id]
        );

        if (detailsResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return { success: false, message: "No bobbin details found for this TC" };
        }

        const bobbinNos = detailsResult.rows.map(row => row.bobbin_no);

        // Update bobbin_entries dispatch_status to 'YES'
        const placeholders = bobbinNos.map((_, i) => `$${i + 1}`).join(", ");
        const updateResult = await client.query(
            `UPDATE bobbin_entries SET dispatch_status = 'YES' WHERE bobbin_no IN (${placeholders})`,
            bobbinNos
        );

        await client.query("COMMIT");

        return {
            success: true,
            message: "All bobbins dispatched successfully",
            dispatched_count: updateResult.rowCount
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
