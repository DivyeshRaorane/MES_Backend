import pool from "../../db/postgres.js";

export const getCycleByBarcodeS = async (bobbin_no) => {
    const cycleResult = await pool.query(
        `SELECT * FROM temp_cycle_entry WHERE bobbin_no = $1 ORDER BY temp_cycle_id ASC`,
        [bobbin_no]
    );

    const metaResult = await pool.query(
        `SELECT result, physical_obs, prepared_by, checked_by FROM temp_entry WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (cycleResult.rows.length === 0) {
        return { exists: false, data: [] };
    }

    const meta = metaResult.rows[0] || {};

    return {
        exists: true,
        result: meta.result || null,
        physical_obs: meta.physical_obs || null,
        prepared_by: meta.prepared_by || null,
        checked_by: meta.checked_by || null,
        data: cycleResult.rows
    };
};

export const saveCycleEntryS = async (payload) => {
    const client = await pool.connect();
   
    try {
        await client.query("BEGIN");

        const { bobbin_no, result, physical_obs, prepared_by, checked_by, cycles, logged_in_user } = payload;

        // Step 1: Check temp_entry exists
        const tempCheck = await client.query(
            `SELECT temp_entry_id, end_date, end_time FROM temp_entry WHERE bobbin_no = $1 LIMIT 1`,
            [bobbin_no]
        );

        if (tempCheck.rows.length === 0) {
            throw new Error("Temp entry not found for this barcode. Create temp entry first.");
        }

        if (tempCheck.rows[0].end_date && tempCheck.rows[0].end_time) {
            throw new Error("This entry is already completed.");
        }

        // Step 2: Delete existing cycle entries (allow re-save)
        await client.query(
            `DELETE FROM temp_cycle_entry WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        // Step 3: Insert each cycle row
        for (const cycle of cycles) {
            await client.query(
                `INSERT INTO temp_cycle_entry (
                    bobbin_no, temperature, "date", "time", nm_1310, nm_1550, nm_1625,
                    operator, remark, logged_in_user
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [
                    bobbin_no, cycle.temperature, cycle.date, cycle.time,
                    cycle.nm_1310 || null, cycle.nm_1550 || null, cycle.nm_1625 || null,
                    cycle.operator || null, cycle.remark || null, logged_in_user
                ]
            );
        }

        // Step 4: Update temp_entry
        await client.query(
            `UPDATE temp_entry SET
                result = $1, physical_obs = $2, prepared_by = $3, checked_by = $4,
                end_date = CURRENT_DATE, end_time = CURRENT_TIME, logged_in_user = $5
             WHERE bobbin_no = $6`,
            [result, physical_obs || null, prepared_by || null, checked_by || null, logged_in_user, bobbin_no]
        );

        await client.query("COMMIT");

        return { success: true, message: "Cycle entry saved & temp entry updated successfully" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
