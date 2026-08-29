import pool from "../../db/postgres.js";

export const getHthaEntryListS = async (filters) => {
    const { bobbin_no, date_from, date_to } = filters;
    let query = `SELECT * FROM htha_entry WHERE 1=1`;
    const params = [];

    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND start_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND start_date <= $${params.length}`; }

    query += ` ORDER BY htha_entry_id DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getHthaEntryByIdS = async (id) => {
    const master = await pool.query(`SELECT * FROM htha_entry WHERE htha_entry_id = $1`, [id]);
    if (master.rows.length === 0) return null;

    const days = await pool.query(
        `SELECT * FROM htha_day_entry WHERE htha_entry_id = $1 ORDER BY htha_day ASC`,
        [id]
    );

    // Single max change-in-attenuation row for this entry (may not exist yet)
    const maxChResult = await pool.query(
        `SELECT max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
         FROM htha_ch_entry WHERE htha_entry_id = $1 LIMIT 1`,
        [id]
    );

    const maxCh = maxChResult.rows[0] || {
        max_ch_nm_1310: null,
        max_ch_nm_1550: null,
        max_ch_nm_1625: null
    };

    return { master: master.rows[0], days: days.rows, maxCh };
};

export const createHthaEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, days, maxCh, logged_in_user } = payload;

        const masterResult = await client.query(
            `INSERT INTO htha_entry (
                bobbin_no, format_no, gr_clause_no, title, req_per_gr,
                testing_standard, marker_a, marker_b, temp, start_date, start_time,
                end_date, end_time, fiber_length, remark, tested_by, checked_by,
                at_1310, at_1550, at_1625, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING htha_entry_id`,
            [
                master.bobbin_no, master.format_no, master.gr_clause_no, master.title, master.req_per_gr,
                master.testing_standard, master.marker_a, master.marker_b, master.temp,
                master.start_date, master.start_time, master.end_date || null, master.end_time || null,
                master.fiber_length, master.remark || null, master.tested_by || null, master.checked_by || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user
            ]
        );

        const htha_entry_id = masterResult.rows[0].htha_entry_id;

        if (days && days.length > 0) {
            for (const day of days) {
                await client.query(
                    `INSERT INTO htha_day_entry (htha_entry_id, bobbin_no, htha_date, htha_day, at_1310, at_1550, at_1625, logged_in_user)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [htha_entry_id, master.bobbin_no, day.htha_date || null, day.htha_day, day.at_1310 || null, day.at_1550 || null, day.at_1625 || null, logged_in_user]
                );
            }
        }

        // Insert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO htha_ch_entry (
                    htha_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)`,
                [
                    htha_entry_id,
                    maxCh.max_ch_nm_1310 || null,
                    maxCh.max_ch_nm_1550 || null,
                    maxCh.max_ch_nm_1625 || null
                ]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "HTHA Entry created successfully", htha_entry_id };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const updateHthaEntryS = async (id, payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, days, maxCh, logged_in_user } = payload;

        await client.query(
            `UPDATE htha_entry SET
                bobbin_no=$1, format_no=$2, gr_clause_no=$3, title=$4, req_per_gr=$5,
                testing_standard=$6, marker_a=$7, marker_b=$8, temp=$9,
                start_date=$10, start_time=$11, end_date=$12, end_time=$13,
                fiber_length=$14, remark=$15, tested_by=$16, checked_by=$17,
                at_1310=$18, at_1550=$19, at_1625=$20, logged_in_user=$21
             WHERE htha_entry_id = $22`,
            [
                master.bobbin_no, master.format_no, master.gr_clause_no, master.title, master.req_per_gr,
                master.testing_standard, master.marker_a, master.marker_b, master.temp,
                master.start_date, master.start_time, master.end_date || null, master.end_time || null,
                master.fiber_length, master.remark || null, master.tested_by || null, master.checked_by || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user, id
            ]
        );

        await client.query(`DELETE FROM htha_day_entry WHERE htha_entry_id = $1`, [id]);

        if (days && days.length > 0) {
            for (const day of days) {
                await client.query(
                    `INSERT INTO htha_day_entry (htha_entry_id, bobbin_no, htha_date, htha_day, at_1310, at_1550, at_1625, logged_in_user)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [id, master.bobbin_no, day.htha_date || null, day.htha_day, day.at_1310 || null, day.at_1550 || null, day.at_1625 || null, logged_in_user]
                );
            }
        }

        // Upsert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO htha_ch_entry (
                    htha_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)
                ON CONFLICT (htha_entry_id) DO UPDATE SET
                    max_ch_nm_1310 = EXCLUDED.max_ch_nm_1310,
                    max_ch_nm_1550 = EXCLUDED.max_ch_nm_1550,
                    max_ch_nm_1625 = EXCLUDED.max_ch_nm_1625`,
                [
                    id,
                    maxCh.max_ch_nm_1310 || null,
                    maxCh.max_ch_nm_1550 || null,
                    maxCh.max_ch_nm_1625 || null
                ]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "HTHA Entry updated successfully" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
