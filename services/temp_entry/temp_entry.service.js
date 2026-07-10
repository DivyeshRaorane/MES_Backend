import pool from "../../db/postgres.js";

export const getBobbinByBarcodeS = async (bobbin_no) => {
    const result = await pool.query(
        `SELECT bobbin_no, fid AS bobbin_fid, preform_id, spool_id, tower_no, fiber_length AS total_length
         FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};

export const saveTempEntryS = async (payload) => {
    const {
        bobbin_no, bobbin_fid, preform_id, spool_id, tower_no, total_length,
        testing_standard, start_date, start_time, end_date, end_time,
        remark, at_1310, at_1550, at_1625, logged_in_user
    } = payload;

    const result = await pool.query(
        `INSERT INTO temp_entry (
            bobbin_no, bobbin_fid, preform_id, spool_id, tower_no, total_length,
            testing_standard, start_date, start_time, end_date, end_time,
            remark, at_1310, at_1550, at_1625, logged_in_user
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING temp_entry_id`,
        [
            bobbin_no, bobbin_fid, preform_id, spool_id, tower_no, total_length,
            testing_standard, start_date, start_time, end_date || null, end_time || null,
            remark || null, at_1310 || null, at_1550 || null, at_1625 || null, logged_in_user
        ]
    );

    return result.rows[0].temp_entry_id;
};

export const checkExistingTempEntryS = async (bobbin_no) => {
    const result = await pool.query(
        `SELECT temp_entry_id, bobbin_no, bobbin_fid, preform_id, spool_id, tower_no,
                total_length, testing_standard, start_date, start_time, end_date, end_time,
                remark, at_1310, at_1550, at_1625, logged_in_user, created_at
         FROM temp_entry WHERE bobbin_no = $1 ORDER BY created_at DESC LIMIT 1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return { exists: false, data: null };
    }

    return { exists: true, data: result.rows[0] };
};

export const updateTempEntryS = async (id, payload) => {
    // Check if already completed
    const check = await pool.query(
        `SELECT end_date, end_time FROM temp_entry WHERE temp_entry_id = $1`,
        [id]
    );

    if (check.rows.length === 0) {
        throw new Error("Temp entry not found.");
    }

    if (check.rows[0].end_date && check.rows[0].end_time) {
        throw new Error("This entry is already completed.");
    }

    const {
        testing_standard, start_date, start_time, end_date, end_time,
        remark, at_1310, at_1550, at_1625, logged_in_user
    } = payload;

    await pool.query(
        `UPDATE temp_entry SET
            testing_standard = $1, start_date = $2, start_time = $3,
            end_date = $4, end_time = $5, remark = $6,
            at_1310 = $7, at_1550 = $8, at_1625 = $9, logged_in_user = $10
         WHERE temp_entry_id = $11`,
        [testing_standard, start_date, start_time, end_date || null, end_time || null,
         remark || null, at_1310 || null, at_1550 || null, at_1625 || null, logged_in_user, id]
    );

    return { success: true, message: "Temp Entry updated successfully" };
};
