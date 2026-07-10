import pool from "../../db/postgres.js";

export const getTrhByBarcodeS = async (bobbin_no) => {
    // Get bobbin info
    const bobbinResult = await pool.query(
        `SELECT preform_id, spool_id, tower_no, fiber_length AS total_length
         FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (bobbinResult.rows.length === 0) {
        return null;
    }

    // Get existing trh_entry
    const trhResult = await pool.query(
        `SELECT * FROM trh_entry WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    // Get existing cycle rows
    const cycleResult = await pool.query(
        `SELECT * FROM trh_cyce_entry WHERE bobbin_no = $1 ORDER BY cycle_no ASC, trh_cyce_entry_id ASC`,
        [bobbin_no]
    );

    return {
        bobbin: bobbinResult.rows[0],
        trh_entry: trhResult.rows[0] || null,
        cycles: cycleResult.rows
    };
};

export const saveTrhEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            bobbin_no, preform_id, tower_no, spool_id, total_length,
            testing_standard, start_date, start_time, end_date, end_time,
            remark, at_1310, at_1550, at_1625, existing_id, cycles, logged_in_user
        } = payload;

        // Step 1: Insert or Update trh_entry
        if (existing_id) {
            await client.query(
                `UPDATE trh_entry SET
                    preform_id = $1, tower_no = $2, spool_id = $3, total_length = $4,
                    testing_standard = $5, start_date = $6, start_time = $7,
                    end_date = $8, end_time = $9, remark = $10,
                    at_1310 = $11, at_1550 = $12, at_1625 = $13, logged_in_user = $14
                 WHERE trh_entry_id = $15`,
                [preform_id, tower_no, spool_id, total_length,
                 testing_standard, start_date, start_time,
                 end_date || null, end_time || null, remark || null,
                 at_1310 || null, at_1550 || null, at_1625 || null, logged_in_user, existing_id]
            );
        } else {
            await client.query(
                `INSERT INTO trh_entry (
                    bobbin_no, preform_id, tower_no, spool_id, total_length,
                    testing_standard, start_date, start_time, end_date, end_time,
                    remark, at_1310, at_1550, at_1625, logged_in_user
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
                [bobbin_no, preform_id, tower_no, spool_id, total_length,
                 testing_standard, start_date, start_time,
                 end_date || null, end_time || null, remark || null,
                 at_1310 || null, at_1550 || null, at_1625 || null, logged_in_user]
            );
        }

        // Step 2: Delete existing cycle rows
        await client.query(
            `DELETE FROM trh_cyce_entry WHERE bobbin_no = $1`,
            [bobbin_no]
        );

        // Step 3: Insert all cycle rows
        for (const cycle of cycles) {
            await client.query(
                `INSERT INTO trh_cyce_entry (
                    bobbin_no, cycle_no, temperature, rh, trh_date, trh_time,
                    at_1550, at_1625, tested_by, logged_in_user
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [
                    bobbin_no, cycle.cycle_no, cycle.temperature, cycle.rh,
                    cycle.trh_date || null, cycle.trh_time || null,
                    cycle.at_1550 || null, cycle.at_1625 || null,
                    cycle.tested_by || null, logged_in_user
                ]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "TRH entry saved successfully" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
