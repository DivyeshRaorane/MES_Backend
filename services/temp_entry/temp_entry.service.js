import pool from "../../db/postgres.js";

const FIXED_TEMPS = [23, -60, 85, -60, 85, 23];

// List temp entries with filters
export const getTempEntryListS = async (filters) => {
    const { bobbin_no, date_from, date_to } = filters;
    let query = `SELECT * FROM temp_entry WHERE 1=1`;
    const params = [];

    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND created_at::date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND created_at::date <= $${params.length}`; }

    query += ` ORDER BY temp_entry_id DESC`;

    const result = await pool.query(query, params);
    console.log("Result", result)
    return result.rows;
};

// Get single temp entry + cycles
export const getTempEntryByIdS = async (id) => {
    const master = await pool.query(`SELECT * FROM temp_entry WHERE temp_entry_id = $1`, [id]);
    if (master.rows.length === 0) return null;

    const cycles = await pool.query(
        `SELECT * FROM temp_cycle_entry WHERE temp_entry_id = $1 ORDER BY temp_cycle_id ASC`,
        [id]
    );

    // Single max change-in-attenuation row for this entry (may not exist yet)
    const maxChResult = await pool.query(
        `SELECT max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
         FROM temp_ch_entry WHERE temp_entry_id = $1 LIMIT 1`,
        [id]
    );

    const maxCh = maxChResult.rows[0] || {
        max_ch_nm_1310: null,
        max_ch_nm_1550: null,
        max_ch_nm_1625: null
    };

    return { master: master.rows[0], cycles: cycles.rows, maxCh };
};

// Create temp entry with cycles (transaction)
export const createTempEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, cycles, maxCh, logged_in_user } = payload;

        const masterResult = await client.query(
            `INSERT INTO temp_entry (
                tesing_standrd, format_no, gr_clause_no, req_per_gr, bobbin_no, fiber_length,
                marker_a, marker_b, start_date, start_time, end_date, end_time, remark, result,
                prepared_by, checked_by, physical_obs, at_1310, at_1550, at_1625, logged_in_user
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING temp_entry_id`,
            [
                master.tesing_standrd, master.format_no, master.gr_clause_no, master.req_per_gr,
                master.bobbin_no, master.fiber_length, master.marker_a, master.marker_b,
                master.start_date, master.start_time, master.end_date || null, master.end_time || null,
                master.remark || null, master.result || null, master.prepared_by || null,
                master.checked_by || null, master.physical_obs || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user
            ]
        );

        const temp_entry_id = masterResult.rows[0].temp_entry_id;

        if (cycles && cycles.length > 0) {
            for (let i = 0; i < cycles.length; i++) {
                const c = cycles[i];
                await client.query(
                    `INSERT INTO temp_cycle_entry (
                        temp_entry_id, bobbin_no, temperature, "date", "time",
                        nm_1310, nm_1550, nm_1625, operator, remark, logged_in_user
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                    [
                        temp_entry_id, master.bobbin_no, FIXED_TEMPS[i],
                        c.date || null, c.time || null,
                        c.nm_1310 || null, c.nm_1550 || null, c.nm_1625 || null,
                        c.operator || null, c.remark || null, logged_in_user
                    ]
                );
            }
        }

        // Insert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO temp_ch_entry (
                    temp_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)`,
                [
                    temp_entry_id,
                    maxCh.max_ch_nm_1310 || null,
                    maxCh.max_ch_nm_1550 || null,
                    maxCh.max_ch_nm_1625 || null
                ]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "Temp Entry created successfully", temp_entry_id };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Update temp entry with cycles (transaction)
export const updateTempEntryS = async (id, payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, cycles, maxCh, logged_in_user } = payload;

        await client.query(
            `UPDATE temp_entry SET
                tesing_standrd=$1, format_no=$2, gr_clause_no=$3, req_per_gr=$4,
                bobbin_no=$5, fiber_length=$6, marker_a=$7, marker_b=$8,
                start_date=$9, start_time=$10, end_date=$11, end_time=$12,
                remark=$13, result=$14, prepared_by=$15, checked_by=$16,
                physical_obs=$17, at_1310=$18, at_1550=$19, at_1625=$20, logged_in_user=$21
             WHERE temp_entry_id = $22`,
            [
                master.tesing_standrd, master.format_no, master.gr_clause_no, master.req_per_gr,
                master.bobbin_no, master.fiber_length, master.marker_a, master.marker_b,
                master.start_date, master.start_time, master.end_date || null, master.end_time || null,
                master.remark || null, master.result || null, master.prepared_by || null,
                master.checked_by || null, master.physical_obs || null,
                master.at_1310 || null, master.at_1550 || null, master.at_1625 || null, logged_in_user, id
            ]
        );

        // Delete old cycles and re-insert
        await client.query(`DELETE FROM temp_cycle_entry WHERE temp_entry_id = $1`, [id]);

        if (cycles && cycles.length > 0) {
            for (let i = 0; i < cycles.length; i++) {
                const c = cycles[i];
                await client.query(
                    `INSERT INTO temp_cycle_entry (
                        temp_entry_id, bobbin_no, temperature, "date", "time",
                        nm_1310, nm_1550, nm_1625, operator, remark, logged_in_user
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                    [
                        id, master.bobbin_no, FIXED_TEMPS[i],
                        c.date || null, c.time || null,
                        c.nm_1310 || null, c.nm_1550 || null, c.nm_1625 || null,
                        c.operator || null, c.remark || null, logged_in_user
                    ]
                );
            }
        }

        // Upsert the single max change-in-attenuation row for this entry
        if (maxCh) {
            await client.query(
                `INSERT INTO temp_ch_entry (
                    temp_entry_id, max_ch_nm_1310, max_ch_nm_1550, max_ch_nm_1625
                ) VALUES ($1,$2,$3,$4)
                ON CONFLICT (temp_entry_id) DO UPDATE SET
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
        return { success: true, message: "Temp Entry updated successfully" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
