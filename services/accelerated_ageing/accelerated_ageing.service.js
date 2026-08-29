import pool from "../../db/postgres.js";

export const getAatEntryListS = async (filters) => {
    const { bobbin_no, date_from, date_to } = filters;
    let query = `SELECT * FROM aat_entry WHERE 1=1`;
    const params = [];

    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND start_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND start_date <= $${params.length}`; }

    query += ` ORDER BY aat_entry_id DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getAatEntryByIdS = async (id) => {
    const master = await pool.query(`SELECT * FROM aat_entry WHERE aat_entry_id = $1`, [id]);
    if (master.rows.length === 0) return null;

    const days = await pool.query(
        `SELECT * FROM aat_day_entry WHERE aat_entry_id = $1 ORDER BY aat_day ASC`,
        [id]
    );

    // Single max change-in-attenuation row for this entry (may not exist yet)
    const maxChResult = await pool.query(
        `SELECT max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
         FROM aat_ch_entry WHERE aat_entry_id = $1 LIMIT 1`,
        [id]
    );

    const maxCh = maxChResult.rows[0] || {
        max_ch_nm_1310: null,
        max_ch_nm_1550: null,
        max_ch_nm_1625: null
    };

    return { master: master.rows[0], days: days.rows, maxCh };
};

export const createAatEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, days, maxCh, logged_in_user } = payload;

        const masterResult = await client.query(
            `INSERT INTO aat_entry (
                bobbin_no, format_no, title, testing_standard,
                marker_a, marker_b, temp, start_date, start_time,
                end_date, end_time, fiber_length, remark, tested_by, checked_by,
                at_1310, at_1550, at_1625, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
            RETURNING aat_entry_id`,
            [
                master.bobbin_no, master.format_no, master.title, master.testing_standard,
                master.marker_a, master.marker_b, master.temp || null,
                master.start_date || null, master.start_time || null,
                master.end_date || null, master.end_time || null,
                master.fiber_length || null, master.remark || null,
                master.tested_by || null, master.checked_by || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user
            ]
        );

        const aat_entry_id = masterResult.rows[0].aat_entry_id;

        if (days && days.length > 0) {
            for (const day of days) {
                await client.query(
                    `INSERT INTO aat_day_entry (aat_entry_id, bobbin_no, aat_date, aat_day, at_1310, at_1550, at_1625, logged_in_user)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [aat_entry_id, master.bobbin_no, day.aat_date || null, day.aat_day || null, day.at_1310 || null, day.at_1550 || null, day.at_1625 || null, logged_in_user]
                );
            }
        }

        // Insert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO aat_ch_entry (
                    aat_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)`,
                [
                    aat_entry_id,
                    maxCh.max_ch_nm_1310 || null,
                    maxCh.max_ch_nm_1550 || null,
                    maxCh.max_ch_nm_1625 || null
                ]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "Accelerated Aging entry created", aat_entry_id };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const updateAatEntryS = async (id, payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, days, maxCh, logged_in_user } = payload;

        await client.query(
            `UPDATE aat_entry SET
                bobbin_no=$1, format_no=$2, title=$3, testing_standard=$4,
                marker_a=$5, marker_b=$6, temp=$7, start_date=$8, start_time=$9,
                end_date=$10, end_time=$11, fiber_length=$12, remark=$13,
                tested_by=$14, checked_by=$15, at_1310=$16, at_1550=$17, at_1625=$18, logged_in_user=$19
             WHERE aat_entry_id = $20`,
            [
                master.bobbin_no, master.format_no, master.title, master.testing_standard,
                master.marker_a, master.marker_b, master.temp || null,
                master.start_date || null, master.start_time || null,
                master.end_date || null, master.end_time || null,
                master.fiber_length || null, master.remark || null,
                master.tested_by || null, master.checked_by || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user, id
            ]
        );

        await client.query(`DELETE FROM aat_day_entry WHERE aat_entry_id = $1`, [id]);

        if (days && days.length > 0) {
            for (const day of days) {
                await client.query(
                    `INSERT INTO aat_day_entry (aat_entry_id, bobbin_no, aat_date, aat_day, at_1310, at_1550, at_1625, logged_in_user)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [id, master.bobbin_no, day.aat_date || null, day.aat_day || null, day.at_1310 || null, day.at_1550 || null, day.at_1625 || null, logged_in_user]
                );
            }
        }

        // Upsert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO aat_ch_entry (
                    aat_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)
                ON CONFLICT (aat_entry_id) DO UPDATE SET
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
        return { success: true, message: "Accelerated Aging entry updated" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
