import pool from "../../db/postgres.js";

export const getBobbinForPvS = async (bobbin_id) => {
    const query = `
        SELECT bobbin_id, bobbin_fid, spool_fid, spool_id, preform_id, fiber_type, colour, qty_kms
        FROM bobbin_entries
        WHERE bobbin_id = $1 AND is_pv = false
    `;

    const result = await pool.query(query, [bobbin_id]);

    if (result.rows.length === 0) {
        throw new Error("Bobbin not found or already verified");
    }

    return result.rows[0];
};

export const pvEntryS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { header, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            await client.query(
                `
                INSERT INTO pv_entries (
                    pv_type, pv_operator, shift, pv_date, pv_time, pv_remark,
                    bobbin_id, bobbin_fid, spool_fid, spool_id, preform_id,
                    fiber_type, colour, qty_kms, logged_in_user
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                `,
                [
                    header.pv_type,
                    header.pv_operator,
                    header.shift,
                    header.pv_date,
                    header.pv_time,
                    header.pv_remark,
                    bobbin.bobbin_id,
                    bobbin.bobbin_fid,
                    bobbin.spool_fid,
                    bobbin.spool_id,
                    bobbin.preform_id,
                    bobbin.fiber_type,
                    bobbin.colour,
                    bobbin.qty_kms,
                    logged_in_user
                ]
            );

            await client.query(
                `UPDATE bobbin_entries SET is_pv = true WHERE bobbin_id = $1`,
                [bobbin.bobbin_id]
            );
        }

        await client.query("COMMIT");

        return {
            success: true,
            message: `${bobbins.length} bobbin(s) verified successfully`
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
