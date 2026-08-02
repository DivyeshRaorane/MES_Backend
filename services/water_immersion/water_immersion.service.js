import pool from "../../db/postgres.js";

export const getWiEntryListS = async (filters) => {
    const { bobbin_no, date_from, date_to } = filters;
    let query = `SELECT * FROM wi_entry WHERE 1=1`;
    const params = [];

    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND start_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND start_date <= $${params.length}`; }

    query += ` ORDER BY wi_entry_id DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getWiEntryByIdS = async (id) => {
    const master = await pool.query(`SELECT * FROM wi_entry WHERE wi_entry_id = $1`, [id]);
    if (master.rows.length === 0) return null;

    const days = await pool.query(
        `SELECT * FROM wi_day_entry WHERE wi_entry_id = $1 ORDER BY wi_day ASC`,
        [id]
    );

    return { master: master.rows[0], days: days.rows };
};

export const createWiEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, days, logged_in_user } = payload;

        const masterResult = await client.query(
            `INSERT INTO wi_entry (
                bobbin_no, format_no, tite, temp, testing_standard,
                marker_a, marker_b, start_date, start_time, end_date, end_time,
                fiber_length, remark, tested_by, checked_by, at_1310, at_1550, at_1625, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
            RETURNING wi_entry_id`,
            [
                master.bobbin_no, master.format_no, master.tite, master.temp, master.testing_standard,
                master.marker_a, master.marker_b, master.start_date, master.start_time,
                master.end_date || null, master.end_time || null, master.fiber_length,
                master.remark || null, master.tested_by || null, master.checked_by || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user
            ]
        );

        const wi_entry_id = masterResult.rows[0].wi_entry_id;

        if (days && days.length > 0) {
            for (const day of days) {
                await client.query(
                    `INSERT INTO wi_day_entry (wi_entry_id, bobbin_no, wi_date, wi_day, at_1310, at_1550, at_1625, logged_in_user)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [wi_entry_id, master.bobbin_no, day.wi_date || null, day.wi_day, day.at_1310 || null, day.at_1550 || null, day.at_1625 || null, logged_in_user]
                );
            }
        }

        await client.query("COMMIT");
        return { success: true, message: "Water Immersion entry created", wi_entry_id };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const updateWiEntryS = async (id, payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, days, logged_in_user } = payload;

        await client.query(
            `UPDATE wi_entry SET
                bobbin_no=$1, format_no=$2, tite=$3, temp=$4, testing_standard=$5,
                marker_a=$6, marker_b=$7, start_date=$8, start_time=$9, end_date=$10, end_time=$11,
                fiber_length=$12, remark=$13, tested_by=$14, checked_by=$15,
                at_1310=$16, at_1550=$17, at_1625=$18, logged_in_user=$19
             WHERE wi_entry_id = $20`,
            [
                master.bobbin_no, master.format_no, master.tite, master.temp, master.testing_standard,
                master.marker_a, master.marker_b, master.start_date, master.start_time,
                master.end_date || null, master.end_time || null, master.fiber_length,
                master.remark || null, master.tested_by || null, master.checked_by || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user, id
            ]
        );

        await client.query(`DELETE FROM wi_day_entry WHERE wi_entry_id = $1`, [id]);

        if (days && days.length > 0) {
            for (const day of days) {
                await client.query(
                    `INSERT INTO wi_day_entry (wi_entry_id, bobbin_no, wi_date, wi_day, at_1310, at_1550, at_1625, logged_in_user)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [id, master.bobbin_no, day.wi_date || null, day.wi_day, day.at_1310 || null, day.at_1550 || null, day.at_1625 || null, logged_in_user]
                );
            }
        }

        await client.query("COMMIT");
        return { success: true, message: "Water Immersion entry updated" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
