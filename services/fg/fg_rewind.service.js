import pool from "../../db/postgres.js";

export const validateRewindS = async (bobbin_no) => {
    const bobbinResult = await pool.query(
        `SELECT bobbin_no, fid, fiber_length, is_qc_out, dispatch_status
         FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (bobbinResult.rows.length === 0) {
        return { success: false, message: "Bobbin does not exist." };
    }

    const bobbin = bobbinResult.rows[0];

    if (bobbin.is_qc_out !== true) {
        return { success: false, message: "Bobbin is not available in FG." };
    }

    if (bobbin.dispatch_status === 'REW' || bobbin.dispatch_status === 'COLOR'|| bobbin.dispatch_status === 'PACKED') {
        return { success: false, message: `Bobbin already has dispatch status: ${bobbin.dispatch_status}.` };
    }

    // Check if bobbin is in modula tray
    const trayCheck = await pool.query(
        `SELECT tp.position_no, tm.tray_no FROM tray_position tp
         JOIN tray_master tm ON tp.tray_id = tm.tray_id
         WHERE tp.bobbin_no = $1 AND tp.status = 'OCCUPIED'`,
        [bobbin_no]
    );

    if (trayCheck.rows.length > 0) {
        const { tray_no, position_no } = trayCheck.rows[0];
        return { success: false, message: `Bobbin is in Modula Tray ${tray_no}, Position ${position_no}. Remove from tray first.` };
    }

    return {
        success: true,
        data: {
            bobbin_no: bobbin.bobbin_no,
            bobbin_fid: bobbin.fid,
            fiber_length: bobbin.fiber_length
        }
    };
};

export const submitRewindS = async (payload) => {
    console.log("WHat is rew paylaod:", payload)
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { bobbins, from } = payload;

        for (const bobbin of bobbins) {
            let formattedRemark;

            if (bobbin.rewinding_type === 'CUT' && bobbin.cuts && bobbin.cuts.length > 0) {
                const remarkParts = bobbin.cuts.map(cut => {
                    return `Cut from ${cut.p1} km to ${cut.p2} (${cut.c_remark || ''}:)`;
                });
                formattedRemark = remarkParts.join(', ');
            } else {
                formattedRemark = 'Whole Length';
            }

            // Get fid / product_type / fiber_length from bobbin_entries.
            // fid + product_type are needed so we can INSERT a QC row when the
            // bobbin has no QC data yet (Manual REW on an un-tested bobbin);
            // fiber_length is used for balance initialization.
            const bobbinData = await client.query(
                `SELECT fid, product_type, fiber_length FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin.bobbin_no]
            );
            const bobbinFid = bobbin.bobbin_fid || bobbinData.rows[0]?.fid || null;
            const productType = bobbinData.rows[0]?.product_type || null;
            const totalLength = bobbinData.rows[0]?.fiber_length || bobbin.total_length || 0;

            // qc_entry.bobbin_fid is NOT NULL — bail out clearly if we can't
            // resolve a fid (bobbin missing from bobbin_entries and none sent).
            if (!bobbinFid) {
                throw new Error(`Cannot resolve bobbin_fid for ${bobbin.bobbin_no}.`);
            }

            // Operator-typed reason (Whole Length rewind). CUT sends null.
            const rewReason = bobbin.reason ?? null;

            // Upsert qc_entry with remark + reason + grades = REW.
            // Upsert (not plain UPDATE) so a Manual REW on a bobbin that has no
            // QC row yet still gets a REW row created instead of being silently
            // skipped by a zero-row UPDATE.
            await client.query(
                `INSERT INTO qc_entry (bobbin_no, bobbin_fid, product_type, temp_grade, final_grade, remark, reason)
                 VALUES ($1, $2, $3, 'REW', 'REW', $4, $5)
                 ON CONFLICT (bobbin_no) DO UPDATE
                   SET remark      = $4,
                       reason      = $5,
                       temp_grade  = 'REW',
                       final_grade = 'REW'`,
                [bobbin.bobbin_no, bobbinFid, productType, formattedRemark, rewReason]
            );

            // Upsert qc_entry_temp — same
            await client.query(
                `INSERT INTO qc_entry_temp (bobbin_no, bobbin_fid, product_type, temp_grade, final_grade, remark, reason)
                 VALUES ($1, $2, $3, 'REW', 'REW', $4, $5)
                 ON CONFLICT (bobbin_no) DO UPDATE
                   SET remark      = $4,
                       reason      = $5,
                       temp_grade  = 'REW',
                       final_grade = 'REW'`,
                [bobbin.bobbin_no, bobbinFid, productType, formattedRemark, rewReason]
            );

            // Update bobbin_entries grades + dispatch_status
            await client.query(
                `UPDATE bobbin_entries SET temp_grade = 'REW', final_grade = 'REW', dispatch_status = 'REW' WHERE bobbin_no = $1`,
                [bobbin.bobbin_no]
            );

            // When the rewind originates from FG, queue a location-to-location
            // (311) transfer in the unified transactions table for the SAP
            // posting scheduler, mirroring submitColorS.
            if (from === 'FG') {
                // Fetch product_type + fiber_length for the stock_transfer row
                const beResult = await client.query(
                    `SELECT product_type, fiber_length FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                    [bobbin.bobbin_no]
                );
                const material_code = `SMF${(beResult.rows[0]?.product_type || "").toString().trim()}`;
                const comp_quantity = beResult.rows[0]?.fiber_length || bobbin.total_length || 0;

                await client.query(
                    `
                    INSERT INTO transactions (
                        type, comp_material_code, plant, s_location, comp_batch,
                        receiving_plant, receiving_s_location, comp_quantity, uom,
                        ud_type, ud_required, status, created_at
                    )
                    VALUES ('LTL',$1,$2,$3,$4,$5,$6,$7,$8,$9,false,false,current_timestamp)
                    `,
                    [
                        material_code,        // SMF + product_type -> comp_material_code
                        1200,                 // plant
                        1206,                 // s_location
                        bobbin.bobbin_no,     // comp_batch
                        1200,                 // receiving_plant
                        1207,                 // receiving_s_location
                        comp_quantity,        // comp_quantity
                        "KM",                 // uom
                        "UD5",                // ud_type -> follow-up UD row uses UD5 (direct A2 post)
                    ]
                );
            } else {
                // Normal rewind (not from FG): if the bobbin was issued to D2
                // and hasn't gone through QC-out yet, queue the same UD5 LTL
                // transfer but sourced from D2N2 instead of 1206.
                const beResult = await client.query(
                    `SELECT product_type, fiber_length, d2_issue, is_qc_out FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                    [bobbin.bobbin_no]
                );
                const be = beResult.rows[0];

                if (be?.d2_issue === true && be?.is_qc_out === false) {
                    const material_code = `SMF${(be.product_type || "").toString().trim()}`;
                    const comp_quantity = be.fiber_length || bobbin.total_length || 0;

                    await client.query(
                        `
                        INSERT INTO transactions (
                            type, comp_material_code, plant, s_location, comp_batch,
                            receiving_plant, receiving_s_location, comp_quantity, uom,
                            ud_type, ud_required, status, created_at
                        )
                        VALUES ('LTL',$1,$2,$3,$4,$5,$6,$7,$8,$9,false,false,current_timestamp)
                        `,
                        [
                            material_code,        // SMF + product_type -> comp_material_code
                            1200,                 // plant
                            "D2N2",               // s_location
                            bobbin.bobbin_no,     // comp_batch
                            1200,                 // receiving_plant
                            1207,                 // receiving_s_location
                            comp_quantity,        // comp_quantity
                            "KM",                 // uom
                            "UD5",                // ud_type -> follow-up UD row uses UD5 (direct A2 post)
                        ]
                    );
                }
            }
        }

        await client.query("COMMIT");
        return { success: true, message: "Rewind request submitted successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
