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

        const { request_by, date, time, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            // Insert fg_rewind
            await client.query(
                `INSERT INTO fg_rewind (bobbin_no, bobbin_fid, total_length, balance_length, rewinding_type,count, request_by, "date", "time", logged_in_user)
                 VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8,$9)`,
                [bobbin.bobbin_no, bobbin.bobbin_fid, bobbin.total_length, bobbin.rewinding_type,0, request_by, date, time, logged_in_user]
            );

            // If CUT, insert cut instructions
            if (bobbin.rewinding_type === 'CUT' && bobbin.cuts && bobbin.cuts.length > 0) {
                for (const cut of bobbin.cuts) {
                    await client.query(
                        `INSERT INTO rewind_instr (bobbin_no, bobbin_fid, p1, p2)
                         VALUES ($1, $2, $3, $4)`,
                        [bobbin.bobbin_no, bobbin.bobbin_fid, cut.p1, cut.p2]
                    );
                }
            }

            // Update bobbin_entries
            await client.query(
                `UPDATE bobbin_entries SET dispatch_status = 'REW' WHERE bobbin_no = $1`,
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
