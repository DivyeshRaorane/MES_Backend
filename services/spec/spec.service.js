import pool from "../../db/postgres.js";

// preform_vendor_id on spec_master is a comma-separated varchar (e.g. "1,2") — same convention as pt_strain.
// Join against preform_vendor by splitting the string into an int array and aggregate matching vendor names,
// since a single spec can now reference multiple vendors.
export const getSpecListS = async () => {
    try {
        const result = await pool.query(
            `SELECT sm.*, 
                    pv.preform_vendor_names AS preform_vendor_name,
                    bc.bobbin_color_name AS fiber_color_name
             FROM spec_master sm
             LEFT JOIN LATERAL (
                 SELECT string_agg(p.vendor_name, ', ') AS preform_vendor_names
                 FROM preform_vendor p
                 WHERE sm.preform_vendor_id IS NOT NULL
                   AND sm.preform_vendor_id <> ''
                   AND p.preform_vendor_id = ANY (
                       string_to_array(sm.preform_vendor_id, ',')::int[]
                   )
             ) pv ON TRUE
             LEFT JOIN bobbin_color bc ON sm.fiber_color = bc.bobbin_color_id
             WHERE sm.is_active = TRUE 
             ORDER BY sm.spec_id DESC`
        );
        return result.rows;
    } catch (err) {
        // Fallback if new columns don't exist yet
        const result = await pool.query(
            `SELECT * FROM spec_master WHERE is_active = TRUE ORDER BY spec_id DESC`
        );
        return result.rows;
    }
};

export const getSpecByIdS = async (id) => {
    let spec;
    try {
        const result = await pool.query(
            `SELECT sm.*, 
                    pv.preform_vendor_names AS preform_vendor_name,
                    bc.bobbin_color_name AS fiber_color_name
             FROM spec_master sm
             LEFT JOIN LATERAL (
                 SELECT string_agg(p.vendor_name, ', ') AS preform_vendor_names
                 FROM preform_vendor p
                 WHERE sm.preform_vendor_id IS NOT NULL
                   AND sm.preform_vendor_id <> ''
                   AND p.preform_vendor_id = ANY (
                       string_to_array(sm.preform_vendor_id, ',')::int[]
                   )
             ) pv ON TRUE
             LEFT JOIN bobbin_color bc ON sm.fiber_color = bc.bobbin_color_id
             WHERE sm.spec_id = $1`, [id]
        );
        if (result.rows.length === 0) return null;
        spec = result.rows[0];
    } catch (err) {
        // Fallback if new columns don't exist yet
        const result = await pool.query(
            `SELECT * FROM spec_master WHERE spec_id = $1`, [id]
        );
        if (result.rows.length === 0) return null;
        spec = result.rows[0];
    }

    // Fetch mandatory params
    const mandatoryResult = await pool.query(
        `SELECT mandatory_params FROM spec_mandatory WHERE spec_id = $1`, [id]
    );
    spec.mandatory_params = mandatoryResult.rows.length > 0
        ? mandatoryResult.rows[0].mandatory_params
        : [];

    return spec;
};

// Normalize a multi-value field (pt_strain, preform_vendor_id) into a clean comma-separated string.
// Accepts an array (e.g. [1, 2]), a comma-separated string (e.g. "1, 2"), or a single scalar value.
// Trims whitespace, drops empty entries, and returns null if nothing remains.
const normalizeCommaList = (value) => {
    if (value === null || value === undefined || value === '') return null;

    const parts = Array.isArray(value)
        ? value
        : String(value).split(',');

    const cleaned = parts
        .map(v => String(v).trim())
        .filter(v => v.length > 0);

    return cleaned.length > 0 ? cleaned.join(',') : null;
};

export const createSpecS = async (payload) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { logged_in_user, mandatory_params, ...data } = payload;

        // pt_strain, preform_vendor_id and coating_type support multiple values as a comma-separated string
        if ('pt_strain' in data) {
            data.pt_strain = normalizeCommaList(data.pt_strain);
        }
        if ('preform_vendor_id' in data) {
            data.preform_vendor_id = normalizeCommaList(data.preform_vendor_id);
        }
        if ('coating_type' in data) {
            data.coating_type = normalizeCommaList(data.coating_type);
        }

        // Validate color_type + fiber_color relationship
        if ((!data.color_type || data.color_type === 'NATURAL') && data.fiber_color) {
            throw new Error("fiber_color must be null when color_type is 'NATURAL' or not specified");
        }

        // Validate color_type enum
        if (data.color_type && !['NATURAL', 'COLORED', 'RM'].includes(data.color_type)) {
            throw new Error("color_type must be one of: NATURAL, COLORED, RM");
        }

        // Validate customer_type enum (single value, not multi-select)
        if (data.customer_type && !['EXTERNAL', 'INTERNAL'].includes(data.customer_type)) {
            throw new Error("customer_type must be one of: EXTERNAL, INTERNAL");
        }

        // Validate allocation_ratio and minimum_length
        const ratioValue = data.allocation_ratio !== null && data.allocation_ratio !== undefined && data.allocation_ratio !== ''
            ? parseFloat(data.allocation_ratio) : null;
        const minLenValue = data.minimum_length !== null && data.minimum_length !== undefined && data.minimum_length !== ''
            ? parseFloat(data.minimum_length) : null;

        if (ratioValue !== null) {
            if (![2.1, 4.2].includes(ratioValue)) {
                throw new Error("allocation_ratio must be either 2.1 or 4.2");
            }
        }

        // If allocation_ratio is null, minimum_length must also be null
        if (ratioValue === null && minLenValue !== null) {
            throw new Error("minimum_length must be null when allocation_ratio is not set");
        }

        // Validate minimum_length is a multiple of the selected ratio and <= 50.4
        if (minLenValue !== null && ratioValue !== null) {
            const remainder = Math.round((minLenValue % ratioValue) * 10) / 10;
            if (remainder !== 0 && Math.abs(remainder - ratioValue) > 0.01) {
                throw new Error(`minimum_length must be a multiple of ${ratioValue} (e.g. ${ratioValue}, ${ratioValue * 2}, ${ratioValue * 3}, ... up to 50.4)`);
            }
            if (minLenValue < ratioValue || minLenValue > 50.4) {
                throw new Error(`minimum_length must be between ${ratioValue} and 50.4`);
            }
        }

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

        // pt_strain, preform_vendor_id and coating_type support multiple values as a comma-separated string
        if ('pt_strain' in data) {
            data.pt_strain = normalizeCommaList(data.pt_strain);
        }
        if ('preform_vendor_id' in data) {
            data.preform_vendor_id = normalizeCommaList(data.preform_vendor_id);
        }
        if ('coating_type' in data) {
            data.coating_type = normalizeCommaList(data.coating_type);
        }

        // Validate color_type + fiber_color relationship
        if ((!data.color_type || data.color_type === 'NATURAL') && data.fiber_color) {
            throw new Error("fiber_color must be null when color_type is 'NATURAL' or not specified");
        }

        // Validate color_type enum
        if (data.color_type && !['NATURAL', 'COLORED', 'RM'].includes(data.color_type)) {
            throw new Error("color_type must be one of: NATURAL, COLORED, RM");
        }

        // Validate customer_type enum (single value, not multi-select)
        if (data.customer_type && !['EXTERNAL', 'INTERNAL'].includes(data.customer_type)) {
            throw new Error("customer_type must be one of: EXTERNAL, INTERNAL");
        }

        // Validate allocation_ratio and minimum_length
        const ratioValue = data.allocation_ratio !== null && data.allocation_ratio !== undefined && data.allocation_ratio !== ''
            ? parseFloat(data.allocation_ratio) : null;
        const minLenValue = data.minimum_length !== null && data.minimum_length !== undefined && data.minimum_length !== ''
            ? parseFloat(data.minimum_length) : null;

        if (ratioValue !== null) {
            if (![2.1, 4.2].includes(ratioValue)) {
                throw new Error("allocation_ratio must be either 2.1 or 4.2");
            }
        }

        // If allocation_ratio is null, minimum_length must also be null
        if (ratioValue === null && minLenValue !== null) {
            throw new Error("minimum_length must be null when allocation_ratio is not set");
        }

        // Validate minimum_length is a multiple of the selected ratio and <= 50.4
        if (minLenValue !== null && ratioValue !== null) {
            const remainder = Math.round((minLenValue % ratioValue) * 10) / 10;
            if (remainder !== 0 && Math.abs(remainder - ratioValue) > 0.01) {
                throw new Error(`minimum_length must be a multiple of ${ratioValue} (e.g. ${ratioValue}, ${ratioValue * 2}, ${ratioValue * 3}, ... up to 50.4)`);
            }
            if (minLenValue < ratioValue || minLenValue > 50.4) {
                throw new Error(`minimum_length must be between ${ratioValue} and 50.4`);
            }
        }

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
