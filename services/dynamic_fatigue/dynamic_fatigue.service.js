import pool from "../../db/postgres.js";

export const getDynamicFatigueListS = async (filters) => {
    const { bobbin_no, date_from, date_to } = filters;
    let query = `SELECT * FROM dyanmic_fartique WHERE 1=1`;
    const params = [];

    if (bobbin_no) { params.push(`%${bobbin_no}%`); query += ` AND bobbin_no ILIKE $${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND created_at::date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND created_at::date <= $${params.length}`; }

    query += ` ORDER BY dynamic_fartique_id DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const getDynamicFatigueByIdS = async (id) => {
    const master = await pool.query(`SELECT * FROM dyanmic_fartique WHERE dynamic_fartique_id = $1`, [id]);
    if (master.rows.length === 0) return null;

    const speeds = await pool.query(
        `SELECT * FROM dyanmic_fartique_speed WHERE dynamic_fartique_id = $1 ORDER BY fiber_type, speed, dyanmic_fartique_speed_id`,
        [id]
    );

    return { master: master.rows[0], speeds: speeds.rows };
};

export const createDynamicFatigueS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, speeds, logged_in_user } = payload;

        const masterResult = await client.query(
            `INSERT INTO dyanmic_fartique (bobbin_no, format_no, gr_clause_no, title, logged_in_user)
             VALUES ($1,$2,$3,$4,$5) RETURNING dynamic_fartique_id`,
            [master.bobbin_no, master.format_no, master.gr_clause_no, master.title, logged_in_user]
        );

        const id = masterResult.rows[0].dynamic_fartique_id;

        if (speeds && speeds.length > 0) {
            for (const row of speeds) {
                await client.query(
                    `INSERT INTO dyanmic_fartique_speed (
                        dynamic_fartique_id, bobbin_no, fiber_type, speed,
                        ts_kg, ext_mm, gpa, time_min, stress_rate, ln_stress_rate, ln_stress,
                        slope, n_value, logged_in_user
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
                    [
                        id, master.bobbin_no, row.fiber_type, row.speed,
                        row.ts_kg || null, row.ext_mm || null, row.gpa || null, row.time_min || null,
                        row.stress_rate || null, row.ln_stress_rate || null, row.ln_stress || null,
                        row.slope || null, row.n_value || null, logged_in_user
                    ]
                );
            }
        }

        await client.query("COMMIT");
        return { success: true, message: "Dynamic Fatigue entry created", dynamic_fartique_id: id };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const updateDynamicFatigueS = async (id, payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { master, speeds, logged_in_user } = payload;

        await client.query(
            `UPDATE dyanmic_fartique SET bobbin_no=$1, format_no=$2, gr_clause_no=$3, title=$4, logged_in_user=$5
             WHERE dynamic_fartique_id = $6`,
            [master.bobbin_no, master.format_no, master.gr_clause_no, master.title, logged_in_user, id]
        );

        await client.query(`DELETE FROM dyanmic_fartique_speed WHERE dynamic_fartique_id = $1`, [id]);

        if (speeds && speeds.length > 0) {
            for (const row of speeds) {
                await client.query(
                    `INSERT INTO dyanmic_fartique_speed (
                        dynamic_fartique_id, bobbin_no, fiber_type, speed,
                        ts_kg, ext_mm, gpa, time_min, stress_rate, ln_stress_rate, ln_stress,
                        slope, n_value, logged_in_user
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
                    [
                        id, master.bobbin_no, row.fiber_type, row.speed,
                        row.ts_kg || null, row.ext_mm || null, row.gpa || null, row.time_min || null,
                        row.stress_rate || null, row.ln_stress_rate || null, row.ln_stress || null,
                        row.slope || null, row.n_value || null, logged_in_user
                    ]
                );
            }
        }

        await client.query("COMMIT");
        return { success: true, message: "Dynamic Fatigue entry updated" };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
