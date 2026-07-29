import pool from "../../db/postgres.js";

export const getSpecListS = async () => {
    const result = await pool.query(
        `SELECT * FROM spec_master WHERE is_active = TRUE ORDER BY spec_id DESC`
    );
    return result.rows;
};

export const getSpecByIdS = async (id) => {
    const result = await pool.query(`SELECT * FROM spec_master WHERE spec_id = $1`, [id]);
    if (result.rows.length === 0) return null;

    const spec = result.rows[0];

    // Fetch mandatory params
    const mandatoryResult = await pool.query(
        `SELECT mandatory_params FROM spec_mandatory WHERE spec_id = $1`, [id]
    );
    spec.mandatory_params = mandatoryResult.rows.length > 0
        ? mandatoryResult.rows[0].mandatory_params
        : [];

    return spec;
};

export const createSpecS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { logged_in_user, mandatory_params, ...data } = payload;

        const keys = Object.keys(data);
        const values = keys.map(k => data[k] === '' ? null : data[k]);
        keys.push('created_by');
        values.push(logged_in_user);

        const placeholders = values.map((_, i) => `$${i + 1}`).join(',');

        const result = await client.query(
            `INSERT INTO spec_master (${keys.join(',')}) VALUES (${placeholders}) RETURNING spec_id`,
            values
        );

        const spec_id = result.rows[0].spec_id;

        // Insert mandatory params if provided
        if (mandatory_params && Array.isArray(mandatory_params) && mandatory_params.length > 0) {
            await client.query(
                `INSERT INTO spec_mandatory (spec_id, product_type, mandatory_params)
                 VALUES ($1, $2, $3)`,
                [spec_id, data.product_type || '', JSON.stringify(mandatory_params)]
            );
        }

        await client.query('COMMIT');

        return { success: true, message: "Specification created", spec_id };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const updateSpecS = async (id, payload) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { logged_in_user, mandatory_params, ...data } = payload;

        const keys = Object.keys(data);
        const values = keys.map(k => data[k] === '' ? null : data[k]);

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        values.push(id);

        await client.query(
            `UPDATE spec_master SET ${setClause}, updated_at = NOW() WHERE spec_id = $${values.length}`,
            values
        );

        // Upsert mandatory params
        if (mandatory_params && Array.isArray(mandatory_params)) {
            const existing = await client.query(
                'SELECT spec_mandatory_id FROM spec_mandatory WHERE spec_id = $1', [id]
            );

            if (existing.rows.length > 0) {
                await client.query(
                    `UPDATE spec_mandatory
                     SET product_type = $2, mandatory_params = $3, updated_at = CURRENT_TIMESTAMP
                     WHERE spec_id = $1`,
                    [id, data.product_type || '', JSON.stringify(mandatory_params)]
                );
            } else if (mandatory_params.length > 0) {
                await client.query(
                    `INSERT INTO spec_mandatory (spec_id, product_type, mandatory_params)
                     VALUES ($1, $2, $3)`,
                    [id, data.product_type || '', JSON.stringify(mandatory_params)]
                );
            }
        }

        await client.query('COMMIT');

        return { success: true, message: "Specification updated" };
    } catch (error) {
        await client.query('ROLLBACK');
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
