import pool from "../../db/postgres.js";

export const validateColorS = async (bobbin_no, require_color) => {
    const bobbinResult = await pool.query(
        `SELECT bobbin_no, fid, fiber_color, fiber_length, is_qc_out
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

    const colorCheck = await pool.query(
        `SELECT fg_color_id FROM fg_color WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );

    if (colorCheck.rows.length > 0) {
        return { success: false, message: "Color request already exists for this bobbin." };
    }

    if (bobbin.fiber_color === require_color) {
        return { success: false, message: "Bobbin is already in the selected color." };
    }

    return {
        success: true,
        data: {
            bobbin_no: bobbin.bobbin_no,
            bobbin_fid: bobbin.fid,
            fiber_color: bobbin.fiber_color,
            fiber_length: bobbin.fiber_length
        }
    };
};

export const submitColorS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { require_color, request_by, date, time, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            await client.query(
                `INSERT INTO fg_color (bobbin_no, bobbin_fid, current_color, require_color, total_length, balance_length, request_by, "date", "time", last_child_fid, count, logged_in_user)
                 VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, NULL, 0, $9)`,
                [bobbin.bobbin_no, bobbin.bobbin_fid, bobbin.current_color, require_color, bobbin.total_length, request_by, date, time, logged_in_user]
            );

            await client.query(
                `UPDATE bobbin_entries SET dispatch_status = 'COLOR' WHERE bobbin_no = $1`,
                [bobbin.bobbin_no]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "Color request submitted successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
