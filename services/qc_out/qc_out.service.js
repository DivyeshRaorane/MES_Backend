import pool from "../../db/postgres.js";

export const validateBobbinForQcOutS = async (bobbin_no) => {
    const result = await pool.query(
        `SELECT bobbin_no, fid, fiber_type, fiber_color, fiber_length, final_grade, is_qc_out
         FROM bobbin_entries WHERE bobbin_no = $1`,
        [bobbin_no]
    );

    if (result.rows.length === 0) {
        return { success: false, message: "Bobbin not found." };
    }

    const bobbin = result.rows[0];

    if (bobbin.is_qc_out === true) {
        return { success: false, message: "This bobbin has already been QC Out." };
    }

    if (!bobbin.final_grade || bobbin.final_grade === '') {
        return { success: false, message: "Final grade is pending for this bobbin." };
    }

    if (bobbin.final_grade === 'FAIL' || bobbin.final_grade === 'REW') {
        return { success: false, message: `This bobbin cannot be QC Out because its final grade is ${bobbin.final_grade}.` };
    }

    return {
        success: true,
        data: {
            bobbin_no: bobbin.bobbin_no,
            bobbin_fid: bobbin.fid,
            fiber_type: bobbin.fiber_type,
            fiber_color: bobbin.fiber_color,
            fiber_length: bobbin.fiber_length,
            final_grade: bobbin.final_grade
        }
    };
};

export const submitQcOutS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { out_date, user, shift, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            await client.query(
                `INSERT INTO qc_out (bobbin_no, bobbin_fid, out_date, out_time, "user", shift, fiber_length, logged_in_user)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [bobbin.bobbin_no, bobbin.bobbin_fid, out_date, bobbin.out_time, user, shift, bobbin.fiber_length, logged_in_user]
            );

            await client.query(
                `UPDATE bobbin_entries SET is_qc_out = true WHERE bobbin_no = $1`,
                [bobbin.bobbin_no]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "QC Out submitted successfully." };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
