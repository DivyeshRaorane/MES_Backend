import pool from "../../db/postgres.js";

export const drawEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const drawQuery = `
    INSERT INTO draw_entry(
    spool_id,preform_id,
    tower_id,
    start_date,end_date,
    start_time,end_time,
    drawn_weight,drawn_length,
    balance_weight,shift_id,
    drawn_line_speed,draw_tension,
    furnace_power,furnace_argon,
    furnace_he,tube_he,
    co2_flow,n2_flow,
    uv_air,winding_observation_id,
    scr_observation,top_end_scrap,
    bottom_end_scrap,die_clean,
    spool_status,indication_fiber_cut,
    indication_reason_id,
    remark,primary_coating,
    secondary_coating,coating_type,
    primary_pressure,secondary_pressure,
    shift_incharge, furnace_operator,
    die_operator,ground_operator,
    process_type,logged_in_user)
    VALUES ( $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,
        $29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40
        )
        `;

        const drawValues = [
            payload.spool_id,
            payload.preform_id,
            payload.tower_id,

            payload.start_date,
            payload.end_date,
            payload.start_time,
            payload.end_time,

            payload.drawn_weight,
            payload.drawn_length,
            payload.balance_weight,

            payload.shift_id,
            payload.drawn_line_speed,

            payload.draw_tension,

            payload.furnace_power,
            payload.furnace_argon,
            payload.furnace_he,

            payload.tube_he,
            payload.co2_flow,
            payload.n2_flow,
            payload.uv_air,

            payload.winding_observation_id,
            payload.scr_observation,

            payload.top_end_scrap,
            payload.bottom_end_scrap,

            payload.die_clean,
            payload.spool_status,

            payload.indication_fiber_cut,
            payload.indication_reason_id,
            payload.remark,

            payload.primary_coating,
            payload.secondary_coating,

            payload.coating_type,

            payload.primary_pressure,
            payload.secondary_pressure,

            payload.process_type,

            payload.shift_incharge,
            payload.furnace_operator,
            payload.die_operator,
            payload.ground_operator,

            1111
        ];

        await client.query(drawQuery, drawValues);

        if (payload.draw_flaws && payload.draw_flaws.length > 0) {
            const flawQuery = `
        INSERT INTO draw_flaw_details(
        spool_id,flaw_desc,
        start_length,end_length,
        defect_length,actual_cutting,
        logged_in_user)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `;

            for (const flaw of payload.draw_flaws) {
                await client.query(flawQuery, [
                    payload.spool_id,
                    flaw.flaw_desc,
                    flaw.start_length,
                    flaw.end_length,
                    flaw.defect_length,
                    flaw.actual_cutting,
                    1111
                ])
            }
        }

        await client.query("COMMIT");
        return {
            success:true,
            message:"Draw Entry Done Successfully"
        }


    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export const getDrawEntryDataForPTAS = async(payload)=>{
    const {spool_id} = payload;

    const query = `
        SELECT 
            de.preform_id,
            de.drawn_length,
            de.tower_id,
            dt.tower_no
        FROM draw_entry de
        LEFT JOIN draw_tower dt 
            ON dt.tower_id = de.tower_id
        WHERE de.spool_id = $1
    `;

    const result = await pool.query(query, [spool_id]);

    return result.rows[0]
}