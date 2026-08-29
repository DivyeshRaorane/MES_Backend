import pool from "../../db/postgres.js";

export const getTrhEntryListS = async (filters) => {
    const { bobbin_no, date_from, date_to } = filters;
    let query = `SELECT * FROM trh_entry WHERE 1=1`;
    const params = [];

    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND start_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND start_date <= $${params.length}`; }

    query += ` ORDER BY trh_entry_id DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getTrhEntryByIdS = async (id) => {
    const master = await pool.query(`SELECT * FROM trh_entry WHERE trh_entry_id = $1`, [id]);
    if (master.rows.length === 0) return null;

    const cycles = await pool.query(
        `SELECT * FROM trh_cycle_entry WHERE trh_entry_id = $1 ORDER BY cycle_no ASC, trh_cycle_entry_id ASC`,
        [id]
    );

    // Single max change-in-attenuation row for this entry (may not exist yet)
    const maxChResult = await pool.query(
        `SELECT max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
         FROM trh_ch_entry WHERE trh_entry_id = $1 LIMIT 1`,
        [id]
    );

    const maxCh = maxChResult.rows[0] || {
        max_ch_nm_1310: null,
        max_ch_nm_1550: null,
        max_ch_nm_1625: null
    };

    return { master: master.rows[0], cycles: cycles.rows, maxCh };
};

export const createTrhEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, cycles, maxCh, logged_in_user } = payload;

        const masterResult = await client.query(
            `INSERT INTO trh_entry (
                bobbin_no, format_no, gr_clause_no, req_per_gr, temp_hum_range,
                testing_standard, marker_a, marker_b, start_date, start_time,
                end_date, end_time, fiber_length, remark, at_1310, at_1550, at_1625, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
            RETURNING trh_entry_id`,
            [
                master.bobbin_no, master.format_no, master.gr_clause_no, master.req_per_gr,
                master.temp_hum_range, master.testing_standard, master.marker_a, master.marker_b,
                master.start_date, master.start_time, master.end_date || null, master.end_time || null,
                master.fiber_length, master.remark || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user
            ]
        );

        const trh_entry_id = masterResult.rows[0].trh_entry_id;

        if (cycles && cycles.length > 0) {
            for (const c of cycles) {
                await client.query(
                    `INSERT INTO trh_cycle_entry (
                        trh_entry_id, bobbin_no, cycle_no, temperature, rh,
                        trh_date, trh_time, at_1310, at_1550, at_1625, tested_by, logged_in_user
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
                    [
                        trh_entry_id, master.bobbin_no, c.cycle_no, c.temperature, c.rh,
                        c.trh_date || null, c.trh_time || null,
                        c.at_1310 || null, c.at_1550 || null, c.at_1625 || null,
                        c.tested_by || null, logged_in_user
                    ]
                );
            }
        }

        // Insert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO trh_ch_entry (
                    trh_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)`,
                [
                    trh_entry_id,
                    maxCh.max_ch_nm_1310 || null,
                    maxCh.max_ch_nm_1550 || null,
                    maxCh.max_ch_nm_1625 || null
                ]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "TRH Entry created successfully", trh_entry_id };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const updateTrhEntryS = async (id, payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, cycles, maxCh, logged_in_user } = payload;

        await client.query(
            `UPDATE trh_entry SET
                bobbin_no=$1, format_no=$2, gr_clause_no=$3, req_per_gr=$4, temp_hum_range=$5,
                testing_standard=$6, marker_a=$7, marker_b=$8, start_date=$9, start_time=$10,
                end_date=$11, end_time=$12, fiber_length=$13, remark=$14,
                at_1310=$15, at_1550=$16, at_1625=$17, logged_in_user=$18
             WHERE trh_entry_id = $19`,
            [
                master.bobbin_no, master.format_no, master.gr_clause_no, master.req_per_gr,
                master.temp_hum_range, master.testing_standard, master.marker_a, master.marker_b,
                master.start_date, master.start_time, master.end_date || null, master.end_time || null,
                master.fiber_length, master.remark || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user, id
            ]
        );

        await client.query(`DELETE FROM trh_cycle_entry WHERE trh_entry_id = $1`, [id]);

        if (cycles && cycles.length > 0) {
            for (const c of cycles) {
                await client.query(
                    `INSERT INTO trh_cycle_entry (
                        trh_entry_id, bobbin_no, cycle_no, temperature, rh,
                        trh_date, trh_time, at_1310, at_1550, at_1625, tested_by, logged_in_user
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
                    [
                        id, master.bobbin_no, c.cycle_no, c.temperature, c.rh,
                        c.trh_date || null, c.trh_time || null,
                        c.at_1310 || null, c.at_1550 || null, c.at_1625 || null,
                        c.tested_by || null, logged_in_user
                    ]
                );
            }
        }

        // Upsert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO trh_ch_entry (
                    trh_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)
                ON CONFLICT (trh_entry_id) DO UPDATE SET
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
        return { success: true, message: "TRH Entry updated successfully" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
