import pool from "../../db/postgres.js";

const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

// Round to match NUMERIC scale on the columns.
const r3 = (n) => Math.round(n * 1000) / 1000;
const r2 = (n) => Math.round(n * 100) / 100;

export const createDrawShiftReportS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            date, shft, gr_f_opr, die, furnace_opr, sic, maint,
            towers, logged_in_user,
        } = payload;

        const reportIds = [];

        for (const tower of towers) {
            const speed = num(tower.speed);
            const preforms = Array.isArray(tower.preforms) ? tower.preforms : [];

            // Recompute per-DT derived values server-side (never trust client math).
            const plan = r3((speed * 480) / 1000);
            const drawn_length = r3(preforms.reduce((sum, p) => sum + num(p.act_length), 0));
            const efficiency = r2(plan > 0 ? (drawn_length / plan) * 100 : 0);

            // Parent row (one per tower).
            const parentRes = await client.query(
                `INSERT INTO draw_shift_report (
                    report_date, shft, gr_f_opr, die, furnace_opr, sic, maint,
                    dt, speed, plan, drawn_length, efficiency,
                    logged_in_user, created_at
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,
                    $8,$9,$10,$11,$12,
                    $13, now()
                ) RETURNING id`,
                [
                    date, shft, gr_f_opr ?? null, die ?? null, furnace_opr ?? null, sic ?? null, maint ?? null,
                    num(tower.dt), speed, plan, drawn_length, efficiency,
                    logged_in_user,
                ]
            );

            const reportDtId = parentRes.rows[0].id;
            reportIds.push(reportDtId);

            // Child preform rows.
            for (const p of preforms) {
                await client.query(
                    `INSERT INTO draw_shift_report_preform (
                        report_dt_id, preform_id, spool_id, act_length,
                        c_o, f_c, d_c, furnace_e_seq, breaks, activities, created_at
                    ) VALUES (
                        $1,$2,$3,$4,
                        $5,$6,$7,$8,$9,$10, now()
                    )`,
                    [
                        reportDtId,
                        p.preform_id ?? null,
                        p.spool_id ?? null,
                        num(p.act_length),
                        num(p.c_o),
                        num(p.f_c),
                        num(p.d_c),
                        p.furnace_e_seq ?? null,
                        num(p.breaks),
                        p.activities ?? null,
                    ]
                );
            }
        }

        await client.query("COMMIT");

        return {
            success: true,
            message: `Draw shift report saved for ${reportIds.length} towers.`,
            report_ids: reportIds,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
