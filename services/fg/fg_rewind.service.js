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

    if (bobbin.dispatch_status === 'REW' || bobbin.dispatch_status === 'COLOR') {
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
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { bobbins } = payload;

        for (const bobbin of bobbins) {
            let formattedRemark;

            if (bobbin.rewinding_type === 'CUT' && bobbin.cuts && bobbin.cuts.length > 0) {
                const remarkParts = bobbin.cuts.map(cut => {
                    return `Cut from ${cut.p1} km to ${cut.p2}(${cut.c_remark || ''}:)`;
                });
                formattedRemark = remarkParts.join(', ');
            } else {
                formattedRemark = 'Whole Length';
            }

            // Get fiber_length from bobbin_entries for balance initialization
            const bobbinData = await client.query(
                `SELECT fiber_length FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin.bobbin_no]
            );
            const totalLength = bobbinData.rows[0]?.fiber_length || bobbin.total_length || 0;

            // Update qc_entry with remark + grades = REW + balance_length
            await client.query(
                `UPDATE qc_entry SET remark = $1, temp_grade = 'REW', final_grade = 'REW' WHERE bobbin_no = $2`,
                [formattedRemark, bobbin.bobbin_no]
            );

            // Update qc_entry_temp with remark + grades = REW + balance_length
            await client.query(
                `UPDATE qc_entry_temp SET remark = $1, temp_grade = 'REW', final_grade = 'REW' WHERE bobbin_no = $2`,
                [formattedRemark, bobbin.bobbin_no]
            );

            // Update bobbin_entries grades + dispatch_status
            await client.query(
                `UPDATE bobbin_entries SET temp_grade = 'REW', final_grade = 'REW', dispatch_status = 'REW' WHERE bobbin_no = $1`,
                [bobbin.bobbin_no]
            );
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
