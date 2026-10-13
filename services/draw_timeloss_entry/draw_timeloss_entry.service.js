import pool from "../../db/postgres.js";

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

export const createDrawTimelossEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            floor_type, date, shift, operator, shift_incharge,
            rows, logged_in_user,
        } = payload;

        const insertedIds = [];

        for (const row of rows) {
            const result = await client.query(
                `INSERT INTO draw_timeloss_entry (
                    floor_type, entry_date, shift, operator, shift_incharge,
                    dt_no, speed, plan, total_time, draw_length, gap,
                    pm, f_c, c_o, s_up, r_up,
                    bad, bbd, bac, process, maint,
                    utility, eot, mna, speed_loss, trail, no_plan,
                    time_loss, diff,
                    logged_in_user, created_at
                ) VALUES (
                    $1,$2,$3,$4,$5,
                    $6,$7,$8,$9,$10,$11,
                    $12,$13,$14,$15,$16,
                    $17,$18,$19,$20,$21,
                    $22,$23,$24,$25,$26,$27,
                    $28,$29,
                    $30, NOW()
                ) RETURNING id`,
                [
                    floor_type, date, shift, operator ?? null, shift_incharge ?? null,
                    num(row.dt_no), num(row.speed), num(row.plan), num(row.total_time), num(row.draw_length), num(row.gap),
                    num(row.pm), num(row.f_c), num(row.c_o), num(row.s_up), num(row.r_up),
                    num(row.bad), num(row.bbd), num(row.bac), num(row.process), num(row.maint),
                    num(row.utility), num(row.eot), num(row.mna), num(row.speed_loss), num(row.trail), num(row.no_plan),
                    num(row.time_loss), num(row.diff),
                    logged_in_user,
                ]
            );

            insertedIds.push(result.rows[0].id);
        }

        await client.query("COMMIT");

        return {
            success: true,
            message: `Draw timeloss entry saved for ${insertedIds.length} towers.`,
            ids: insertedIds,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
