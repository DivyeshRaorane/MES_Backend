import pool from "../../db/postgres.js";

export const createDrawShiftPlanS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { plan_date, shift, die_operator, ground_operator, furnace_operator, shift_incharge, towers, logged_in_user } = payload;

        for (const tower of towers) {
            await client.query(
                `INSERT INTO draw_shift_plan (
                    "plan_date", shift, die_operator, ground_operator, furnace_operator, shift_incharge,
                    tower_no, theo_speed, actu_speed, ch_ov_num, ch_ov_time, ch_ov_tl,
                    fur_cl_time, pm_tl, downtime, draw_plan, shift_time, logged_in_user
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
                [
                    plan_date, shift, die_operator, ground_operator, furnace_operator, shift_incharge,
                    tower.tower_no, tower.theo_speed, tower.actu_speed, tower.ch_ov_num,
                    tower.ch_ov_time, tower.ch_ov_tl, tower.fur_cl_time, tower.pm_tl,
                    tower.downtime, tower.draw_plan, tower.shift_time, logged_in_user
                ]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: `Shift plan saved for ${towers.length} towers.` };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
