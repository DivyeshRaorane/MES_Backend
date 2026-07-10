import pool from "../../db/postgres.js";

// export const drawEntryS = async (payload) => {
//     const client = await pool.connect();

//     try {
//         await client.query("BEGIN");

//         const drawQuery = `
//     INSERT INTO draw_entry(
//     spool_id,preform_id,
//     tower_id,
//     start_date,end_date,
//     start_time,end_time,
//     drawn_weight,drawn_length,
//     balance_weight,shift_id,
//     drawn_line_speed,draw_tension,
//     furnace_power,furnace_argon,
//     furnace_he,tube_he,
//     co2_flow,n2_flow,
//     uv_air,winding_observation_id,
//     scr_observation,top_end_scrap,
//     bottom_end_scrap,die_clean,
//     spool_status,indication_fiber_cut,
//     indication_reason_id,
//     remark,primary_coating,
//     secondary_coating,coating_type,
//     primary_pressure,secondary_pressure,
//     shift_incharge, furnace_operator,
//     die_operator,ground_operator,
//     process_type,logged_in_user)
//     VALUES ( $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
//         $11,$12,$13,$14,$15,$16,$17,$18,$19,
//         $20,$21,$22,$23,$24,$25,$26,$27,$28,
//         $29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40
//         )
//         `;

//         const drawValues = [
//             payload.spool_id,
//             payload.preform_id,
//             payload.tower_id,

//             payload.start_date,
//             payload.end_date,
//             payload.start_time,
//             payload.end_time,

//             payload.drawn_weight,
//             payload.drawn_length,
//             payload.balance_weight,

//             payload.shift_id,
//             payload.drawn_line_speed,

//             payload.draw_tension,

//             payload.furnace_power,
//             payload.furnace_argon,
//             payload.furnace_he,

//             payload.tube_he,
//             payload.co2_flow,
//             payload.n2_flow,
//             payload.uv_air,

//             payload.winding_observation_id,
//             payload.scr_observation,

//             payload.top_end_scrap,
//             payload.bottom_end_scrap,

//             payload.die_clean,
//             payload.spool_status,

//             payload.indication_fiber_cut,
//             payload.indication_reason_id,
//             payload.remark,

//             payload.primary_coating,
//             payload.secondary_coating,

//             payload.coating_type,

//             payload.primary_pressure,
//             payload.secondary_pressure,

//             payload.process_type,

//             payload.shift_incharge,
//             payload.furnace_operator,
//             payload.die_operator,
//             payload.ground_operator,

//             1111
//         ];

//         await client.query(drawQuery, drawValues);

//         if (payload.draw_flaws && payload.draw_flaws.length > 0) {
//             const flawQuery = `
//         INSERT INTO draw_flaw_details(
//         spool_id,flaw_desc,
//         start_length,end_length,
//         defect_length,actual_cutting,
//         logged_in_user)
//         VALUES ($1,$2,$3,$4,$5,$6,$7)
//         `;

//             for (const flaw of payload.draw_flaws) {
//                 await client.query(flawQuery, [
//                     payload.spool_id,
//                     flaw.reason,
//                     flaw.pos1,
//                     flaw.pos2,
//                     flaw.defect_length,
//                     flaw.actual_cutting,
//                     1111
//                 ])
//             }
//         }

//         await client.query("COMMIT");
//         return {
//             success:true,
//             message:"Draw Entry Done Successfully"
//         }


//     } catch (err) {
//         await client.query("ROLLBACK");
//         throw err;
//     } finally {
//         client.release();
//     }
// }

const toNum = (val) => (val === "" || val === null || val === undefined) ? null : Number(val);

export const drawEntryS = async(payload)=>{
    const client = await pool.connect();

    try{
         await client.query("BEGIN");

         const stockResult = await client.query(
            `
            SELECT * FROM mat_stock
            WHERE batch_id = $1
            `,
            [payload.preform_id]    
         );

         if(stockResult.rows.length <= 0 ){
            throw new Error("Material Stock Not found.")
         }

         const stock = stockResult.rows[0];

         const balanceWeight = Number(stock.balance_qty);
         const usedWeight = Number(payload.drawn_weight);

         const remainingWeight = balanceWeight - usedWeight;
         const spoolNo = Number(stock.p_count) + 1;

        await client.query(
            `
            UPDATE mat_stock
            SET 
            balance_qty = $1,
            p_count = p_count + 1,
            last_fid = $3
            WHERE batch_id = $2
            `,
            [remainingWeight, payload.preform_id, payload.spool_fid]
        );

        const drawResult = await client.query(
            `
            INSERT INTO draw_entry
            (
                tower_no,
                preform_id,
                spool_id,
                spool_fid,
                start_date,
                end_date,
                start_time,
                end_time,
                drawn_weight,
                drawn_length,
                balance_weight,
                shift,
                drawn_line_speed,
                draw_tension,
                furnace_power,
                furnace_argon,
                furnace_he,
                tube_he,
                co2_flow,
                n2_flow,
                uv_air,
                winding_observation,
                scr_observation,
                top_end_scrap,
                bottom_end_scrap,
                die_clean,
                spool_status,
                indication_fiber_cut,
                indication_reason,
                remark,
                primary_coating,
                secondary_coating,
                coating_type,
                primary_pressure,
                secondary_pressure,
                primary_batch,
                secondary_batch,
                process_type,
                preform_type,
                product_type,
                logged_in_user,
                shift_incharge,
                furnace_operator,
                die_operator,
                ground_operator,
                spool_no
            )
                VALUES
            (
                $1,$2,$3,$4,
                $5,$6,$7,$8,
                $9,$10,$11,
                $12,$13,$14,
                $15,$16,$17,$18,
                $19,$20,$21,
                $22,$23,$24,$25,
                $26,$27,
                $28,$29,
                $30,
                $31,$32,$33,
                $34,$35,
                $36,$37,
                $38,$39,$40,
                $41,$42,$43,$44,$45,$46
            )
                RETURNING spool_id
                `,
                [
                    payload.tower_no,
                payload.preform_id,
                payload.spool_id,
                payload.spool_fid,

                payload.start_date,
                payload.end_date,
                payload.start_time,
                payload.end_time,

                toNum(payload.drawn_weight),
                toNum(payload.drawn_length),
                remainingWeight,

                payload.shift,
                toNum(payload.drawn_line_speed),
                toNum(payload.draw_tension),

                toNum(payload.furnace_power),
                toNum(payload.furnace_argon),
                toNum(payload.furnace_he),
                toNum(payload.tube_he),

                toNum(payload.co2_flow),
                toNum(payload.n2_flow),
                toNum(payload.uv_air),

                payload.winding_observation,
                payload.scr_observation,
                toNum(payload.top_end_scrap),
                toNum(payload.bottom_end_scrap),

                payload.die_clean,
                payload.spool_status,

                payload.indication_fiber_cut,
                payload.indication_reason,

                payload.remark,

                payload.primary_coating,
                payload.secondary_coating,
                payload.coating_type,

                toNum(payload.primary_pressure),
                toNum(payload.secondary_pressure),

                payload.primary_batch,
                payload.secondary_batch,

                payload.process_type,
                payload.preform_type,
                payload.product_type,

                payload.logged_in_user,
                payload.shift_incharge,
                payload.furnace_operator,
                payload.die_operator,
                payload.ground_operator,
                spoolNo
                ]
        );

        const spoolId = drawResult.rows[0].spool_id;

        // Insert into mat_stock for this spool
        const mCode = Math.floor(100000 + Math.random() * 900000);

        await client.query(
            `
            INSERT INTO mat_stock (
                m_code, batch_id, uom, activity, updated_at,
                qty, balance_qty, p_count, last_fid
            )
            VALUES ($1, $2, $3, $4,CURRENT_TIMESTAMP, $5, $6, $7, $8)
            `,
            [
                mCode,
                payload.spool_id,
                "KM",
                "spool_entry",
                payload.drawn_length,
                payload.drawn_length,
                0,
                payload.spool_fid
            ]
        );

        if (payload.draw_flaws?.length > 0){
            for (const flaw of payload.draw_flaws){
                await client.query(
                    `
                    INSERT INTO draw_flaw_details
                    (
                    spool_id,
                    reason,
                    pos1,
                    pos2,
                    defect_length,
                    actual_cutting,
                    logged_in_user
                    )
                    VALUES($1,$2,$3,$4,$5,$6,$7)
                    `,
                    [
                        spoolId,
                        flaw.reason,
                        flaw.pos1,
                        flaw.pos2,
                        flaw.defect_length,
                        flaw.actual_cutting,
                        payload.logged_in_user
                    ]
                );

            }
        }

        if (payload.pt_flaws?.length > 0) {
    for (const flaw of payload.pt_flaws) {
        await client.query(
            `
            INSERT INTO pt_flaw_details
            (
                spool_id,
                reason,
                pos1,
                pos2,
                defect_length,
                actual_cutting,
                logged_in_user
            )
            VALUES ($1, $2, $3, $4, $5, $6,$7)
            `,
            [
                spoolId,
                flaw.reason,
                flaw.pos1,
                flaw.pos2,
                flaw.defect_length,
                flaw.actual_cutting,
                payload.logged_in_user
            ]
        );
    }
}

        if (payload.handle_active === true) {
            await client.query(
                `
                UPDATE draw_tower
                SET is_active = true
                WHERE tower_no = $1
                `,
                [payload.tower_no]
            );

            await client.query(
                `
                UPDATE preform_allocation
                SET preform_draw = true
                WHERE preform_id = $1
                `,
                [payload.preform_id]
            );
        }

        if (payload.preform_end === true && payload.handle_active === true) {
            // Set mat_stock balance to 0 for this preform
            await client.query(
                `UPDATE mat_stock SET balance_qty = 0 WHERE batch_id = $1`,
                [payload.preform_id]
            );
        }

        await client.query("COMMIT");

        return {
            success: true,
            spool_id: spoolId,
            spool_no: spoolNo,
            remaining_weight: remainingWeight,
            warning: remainingWeight <= 2,
            tower_no: payload.tower_no,
            preform_id: payload.preform_id
        }

         
    }catch(error){
        await client.query("ROLLBACK");
        throw error;
    }finally{
        await client.release();
    }
}

export const getDrawEntryDataForPTAS = async(payload)=>{
    const {spool_id} = payload;

    const query = `
        SELECT 
            preform_id,
            tower_no,
            drawn_length,
            product_type,
            spool_fid
        FROM draw_entry
        WHERE spool_id = $1
        AND is_pt_allocate = false
    `;

    const result = await pool.query(query, [spool_id]);

    return result.rows[0]
}