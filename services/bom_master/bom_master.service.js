import pool from "../../db/postgres.js";

export const getAllBomsS = async () => {
    const result = await pool.query(`
        SELECT
            material_code,
            material_desc,
            COUNT(*) AS total_components,
            BOOL_AND(is_active) AS is_active,
            MIN(created_at) AS created_at,
            MAX(updated_at) AS updated_at
        FROM bom_master
        GROUP BY material_code, material_desc
        ORDER BY material_code
    `);
    return result.rows;
};

export const getBomByMaterialCodeS = async (materialCode) => {
    const result = await pool.query(
        'SELECT * FROM bom_master WHERE material_code = $1 ORDER BY bom_id',
        [materialCode]
    );

    if (result.rows.length === 0) {
        throw new Error('BOM not found');
    }

    const firstRow = result.rows[0];

    return {
        material_code: firstRow.material_code,
        material_desc: firstRow.material_desc,
        is_active: firstRow.is_active,
        components: result.rows.map(row => ({
            bom_id: row.bom_id,
            component_material_code: row.component_material_code,
            component_material_desc: row.component_material_desc,
            consume_qty_per_km: parseFloat(row.consume_qty_per_km),
        })),
    };
};

export const createBomS = async (payload) => {
    const { material_code, material_desc, components } = payload;
    const client = await pool.connect();

    try {
        // Validation
        if (!material_code) {
            throw new Error('Product Material Code is required');
        }
        if (!components || components.length === 0) {
            throw new Error('At least one component is required');
        }

        // Check for duplicate components in request
        const codes = components.map(c => c.component_material_code);
        const uniqueCodes = new Set(codes);
        if (codes.length !== uniqueCodes.size) {
            throw new Error('Duplicate component material codes found');
        }

        // Check if BOM already exists for this product
        const existing = await client.query(
            'SELECT COUNT(*) FROM bom_master WHERE material_code = $1',
            [material_code]
        );
        if (parseInt(existing.rows[0].count) > 0) {
            throw new Error('BOM already exists for this product. Use Edit instead.');
        }

        await client.query('BEGIN');

        for (const comp of components) {
            if (!comp.component_material_code || !comp.consume_qty_per_km || comp.consume_qty_per_km <= 0) {
                throw new Error('Each component must have a valid code and qty > 0');
            }

            await client.query(`
                INSERT INTO bom_master (material_code, material_desc, component_material_code, component_material_desc, consume_qty_per_km)
                VALUES ($1, $2, $3, $4, $5)
            `, [material_code, material_desc, comp.component_material_code, comp.component_material_desc, comp.consume_qty_per_km]);
        }

        await client.query('COMMIT');
        return { success: true, message: 'BOM created successfully' };
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            throw new Error('Duplicate component found for this product');
        }
        throw error;
    } finally {
        client.release();
    }
};

export const updateBomS = async (materialCode, payload) => {
    const { material_desc, components } = payload;
    const client = await pool.connect();

    try {
        // Validation
        if (!components || components.length === 0) {
            throw new Error('At least one component is required');
        }

        // Check for duplicate components in request
        const codes = components.map(c => c.component_material_code);
        const uniqueCodes = new Set(codes);
        if (codes.length !== uniqueCodes.size) {
            throw new Error('Duplicate component material codes found');
        }

        // Check BOM exists
        const existing = await client.query(
            'SELECT COUNT(*) FROM bom_master WHERE material_code = $1',
            [materialCode]
        );
        if (parseInt(existing.rows[0].count) === 0) {
            throw new Error('BOM not found for this product');
        }

        await client.query('BEGIN');

        // Delete all existing components for this product
        await client.query('DELETE FROM bom_master WHERE material_code = $1', [materialCode]);

        // Re-insert all components
        for (const comp of components) {
            if (!comp.component_material_code || !comp.consume_qty_per_km || comp.consume_qty_per_km <= 0) {
                throw new Error('Each component must have a valid code and qty > 0');
            }

            await client.query(`
                INSERT INTO bom_master (material_code, material_desc, component_material_code, component_material_desc, consume_qty_per_km)
                VALUES ($1, $2, $3, $4, $5)
            `, [materialCode, material_desc, comp.component_material_code, comp.component_material_desc, comp.consume_qty_per_km]);
        }

        await client.query('COMMIT');
        return { success: true, message: 'BOM updated successfully' };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const toggleBomStatusS = async (materialCode, is_active) => {
    const result = await pool.query(
        'UPDATE bom_master SET is_active = $1, updated_at = NOW() WHERE material_code = $2',
        [is_active, materialCode]
    );

    if (result.rowCount === 0) {
        throw new Error('BOM not found');
    }

    return { success: true, message: `BOM ${is_active ? 'activated' : 'deactivated'} successfully` };
};
