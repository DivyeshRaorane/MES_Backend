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
                    tower_no, line_speed, total_time, pm_tl, fur_cl_time, ch_ov_tl,
                    s_up, r_up, downtime, plan_time, plan, logged_in_user
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
                [
                    plan_date, shift, die_operator, ground_operator, furnace_operator, shift_incharge,
                    tower.tower_no, tower.line_speed, tower.total_time, tower.pm_tl,
                    tower.fur_cl_time, tower.ch_ov_tl, tower.s_up, tower.r_up,
                    tower.downtime, tower.plan_time, tower.plan, logged_in_user
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
