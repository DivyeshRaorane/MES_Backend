import pool from "../../db/postgres.js";

export const validateColorS = async (bobbin_no, require_color) => {
    const bobbinResult = await pool.query(
        `SELECT bobbin_no, fid, fiber_color, fiber_length, is_qc_out, dispatch_status, final_grade
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

    if (bobbin.dispatch_status === "PACKED" || bobbin.dispatch_status === "YES" ) {
        return { success: false, message: `Bobbin is Dispatch Status ${bobbin.dispatch_status}`  };
    }

    if (bobbin.final_grade === 'FAIL' || bobbin.final_grade === "REW") {
        return { success: false, message: `Bobbin is ${bobbin.final_grade} We Cannot proceed it For Color` };
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

        const { col_jcard_no, request_by, date, time, bobbins, logged_in_user } = payload;

        for (const bobbin of bobbins) {
            await client.query(
                `INSERT INTO fg_color (bobbin_no, bobbin_fid, current_color, require_color, total_length, balance_length, request_by, col_jcard_no, "date", "time", last_child_fid, count, logged_in_user)
                 VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, NULL, 0, $10)`,
                [bobbin.bobbin_no, bobbin.bobbin_fid, bobbin.current_color, bobbin.require_color, bobbin.total_length, request_by, col_jcard_no, date, time, logged_in_user]
            );

            await client.query(
                `UPDATE bobbin_entries SET dispatch_status = 'COLOR' WHERE bobbin_no = $1`,
                [bobbin.bobbin_no]
            );

            // Fetch product_type for the stock_transfer row
            const beResult = await client.query(
                `SELECT product_type FROM bobbin_entries WHERE bobbin_no = $1 LIMIT 1`,
                [bobbin.bobbin_no]
            );
            const material_code = `SMF${(beResult.rows[0]?.product_type || "").toString().trim()}`;

            // Queue a location-to-location (311) transfer in the unified
            // transactions table for the SAP posting scheduler.
            await client.query(
                `
                INSERT INTO transactions (
                    type, comp_material_code, plant, s_location, comp_batch,
                    receiving_plant, receiving_s_location, comp_quantity, uom,
                    ud_required, status, created_at
                )
                VALUES ('LTL',$1,$2,$3,$4,$5,$6,$7,$8,false,false,current_timestamp)
                `,
                [
                    material_code,        // SMF + product_type -> comp_material_code
                    1200,                 // plant
                    1206,                 // s_location
                    bobbin.bobbin_no,     // comp_batch
                    1200,                 // receiving_plant
                    1207,                 // receiving_s_location
                    bobbin.total_length,  // comp_quantity
                    "KM",                 // uom
                ]
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
