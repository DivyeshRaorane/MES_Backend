import pool from "../../db/postgres.js";

export const getSpecListS = async () => {
    const result = await pool.query(
        `SELECT * FROM spec_master WHERE is_active = TRUE ORDER BY spec_id DESC`
    );
    return result.rows;
};

export const getSpecByIdS = async (id) => {
    const master = await pool.query(`SELECT * FROM spec_master WHERE spec_id = $1`, [id]);
    if (master.rows.length === 0) return null;

    const parameters = await pool.query(
        `SELECT * FROM spec_parameter WHERE spec_id = $1 ORDER BY spec_parameter_id`, [id]
    );

    return { master: master.rows[0], parameters: parameters.rows };
};

export const createSpecS = async (payload) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { master, parameters, logged_in_user } = payload;

        const masterResult = await client.query(
            `INSERT INTO spec_master (customer_name, po_number, pt_strain, cust_spec_name, product_type, coating_type, quantity_km, color, priority, remarks, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING spec_id`,
            [master.customer_name, master.po_number, master.pt_strain, master.cust_spec_name,
             master.product_type, master.coating_type, master.quantity_km, master.color,
             master.priority, master.remarks, logged_in_user]
        );

        const spec_id = masterResult.rows[0].spec_id;

        for (const param of parameters) {
            await client.query(
                `INSERT INTO spec_parameter (spec_id, parameter_name, min_value, max_value) VALUES ($1,$2,$3,$4)`,
                [spec_id, param.parameter_name, param.min_value, param.max_value]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "Specification created", spec_id };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const updateSpecS = async (id, payload) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const { master, parameters } = payload;

        await client.query(
            `UPDATE spec_master SET customer_name=$1, po_number=$2, pt_strain=$3, cust_spec_name=$4,
             product_type=$5, coating_type=$6, quantity_km=$7, color=$8, priority=$9, remarks=$10, updated_at=NOW()
             WHERE spec_id = $11`,
            [master.customer_name, master.po_number, master.pt_strain, master.cust_spec_name,
             master.product_type, master.coating_type, master.quantity_km, master.color,
             master.priority, master.remarks, id]
        );

        await client.query(`DELETE FROM spec_parameter WHERE spec_id = $1`, [id]);

        for (const param of parameters) {
            await client.query(
                `INSERT INTO spec_parameter (spec_id, parameter_name, min_value, max_value) VALUES ($1,$2,$3,$4)`,
                [id, param.parameter_name, param.min_value, param.max_value]
            );
        }

        await client.query("COMMIT");
        return { success: true, message: "Specification updated" };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const deactivateSpecS = async (id) => {
    await pool.query(
        `UPDATE spec_master SET is_active = FALSE, updated_at = NOW() WHERE spec_id = $1`, [id]
    );
    return { success: true, message: "Specification deactivated" };
};
