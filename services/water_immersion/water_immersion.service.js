import pool from "../../db/postgres.js";

export const getWiByBarcodeS = async (bobbin_no) => {
    const bobbinResult = await pool.query(
        `SELECT preform_id, spool_id, tower_no, fiber_length AS total_length
         FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (bobbinResult.rows.length === 0) {
        return null;
    }

    const wiResult = await pool.query(
        `SELECT * FROM wi_entry WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    const dayResult = await pool.query(
        `SELECT * FROM wi_day_entry WHERE bobbin_no = $1 ORDER BY wi_day_entry_id ASC`,
        [bobbin_no]
    );

    return {
        bobbin: bobbinResult.rows[0],
        wi_entry: wiResult.rows[0] || null,
        days: dayResult.rows
    };
};

export const saveWiEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            bobbin_no, preform_id, tower_no, spool_id, total_length,
            testing_standard, start_date, start_time, end_date, end_time,
            remark, tested_by, checked_by, at_1310, at_1550, at_1625,
            existing_id, rows, logged_in_user
        } = payload;

        if (existing_id) {
            await client.query(
                `UPDATE wi_entry SET
                    preform_id=$1, tower_no=$2, spool_id=$3, total_length=$4,
                    testing_standard=$5, start_date=$6, start_time=$7,
                    end_date=$8, end_time=$9, remark=$10,
                    tested_by=$11, checked_by=$12,
                    at_1310=$13, at_1550=$14, at_1625=$15, logged_in_user=$16
                 WHERE wi_entry_id = $17`,
                [preform_id, tower_no, spool_id, total_length,
                 testing_standard, start_date, start_time,
                 end_date || null, end_time || null, remark || null,
                 tested_by || null, checked_by || null,
                 at_1310 || null, at_1550 || null, at_1625 || null, logged_in_user, existing_id]
            );
        } else {
            await client.query(
                `INSERT INTO wi_entry (
                    bobbin_no, preform_id, tower_no, spool_id, total_length,
                    testing_standard, start_date, start_time, end_date, end_time,
                    remark, tested_by, checked_by, at_1310, at_1550, at_1625, logged_in_user
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
                [bobbin_no, preform_id, tower_no, spool_id, total_length,
                 testing_standard, start_date, start_time,
                 end_date || null, end_time || null, remark || null,
                 tested_by || null, checked_by || null,
                 at_1310 || null, at_1550 || null, at_1625 || null, logged_in_user]
            );
        }

        await client.query(`DELETE FROM wi_day_entry WHERE bobbin_no = $1`, [bobbin_no]);

        for (const row of rows) {
            await client.query(
                `INSERT INTO wi_day_entry (bobbin_no, wi_date, wi_day, at_1310, at_1550, at_1625, logged_in_user)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [bobbin_no, row.wi_date || null, row.wi_day, row.at_1310 || null, row.at_1550 || null, row.at_1625 || null, logged_in_user]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "Water Immersion entry saved successfully" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
