import pool from "../../db/postgres.js";

export const getAllProcessOrdersS = async () => {
    const result = await pool.query(`
        SELECT
            po.process_o_no,
            po.material_code,
            po.process_qty,
            po.balance_qty,
            po.is_active,
            po.created_at,
            (SELECT COUNT(*) - 1 FROM process_order WHERE process_o_no = po.process_o_no) AS total_components
        FROM process_order po
        WHERE po.process_o_id = (
            SELECT MIN(process_o_id) FROM process_order WHERE process_o_no = po.process_o_no
        )
        ORDER BY po.created_at DESC
    `);
    return result.rows;
};

export const getProcessOrderByNoS = async (processONo) => {
    const result = await pool.query(
        'SELECT * FROM process_order WHERE process_o_no = $1 ORDER BY process_o_id',
        [processONo]
    );

    if (result.rows.length === 0) {
        throw new Error('Process Order not found');
    }

    return result.rows;
};

export const getProcessOrderMaterialsS = async (processONo) => {
    const result = await pool.query(
        'SELECT * FROM process_order WHERE process_o_no = $1 ORDER BY id',
        [processONo]
    );
    return result.rows;
};

export const createProcessOrderS = async (payload) => {
    const { process_o_no, material_code, process_qty, balance_qty, is_active, materials } = payload;
    console.log("Payload:", payload)
    const client = await pool.connect();

    try {
        // Validation
        if (!process_o_no) {
            throw new Error('Process Order No is required');
        }
        if (!material_code) {
            throw new Error('Material Code is required');
        }
        if (!process_qty || process_qty <= 0) {
            throw new Error('Process Qty must be greater than zero');
        }
        if (!materials || materials.length === 0) {
            throw new Error('At least one component is required');
        }

        // Check if process_o_no already exists
        const existing = await client.query(
            'SELECT process_o_no FROM process_order WHERE process_o_no = $1 LIMIT 1',
            [process_o_no]
        );
        if (existing.rows.length > 0) {
            const err = new Error('Process Order No already exists');
            err.statusCode = 409;
            throw err;
        }

        await client.query('BEGIN');

        // Insert finished material row — balance_qty = process_qty
        await client.query(`
            INSERT INTO process_order (process_o_no, material_code, process_qty, balance_qty, is_active)
            VALUES ($1, $2, $3, $4, true)
        `, [process_o_no, material_code, process_qty, balance_qty || process_qty]);

        // Insert component rows — balance_qty = process_qty for each
        for (const mat of materials) {
            await client.query(`
                INSERT INTO process_order (process_o_no, material_code, process_qty, balance_qty, is_active)
                VALUES ($1, $2, $3, $4, true)
            `, [process_o_no, mat.material_code, mat.process_qty, mat.balance_qty || mat.process_qty]);
        }

        await client.query('COMMIT');

        return {
            process_o_no,
            material_code,
            process_qty,
            components_count: materials.length
        };

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            const err = new Error('Process Order No already exists');
            err.statusCode = 409;
            throw err;
        }
        throw error;
    } finally {
        client.release();
    }
};

export const updateProcessOrderS = async (processONo, payload) => {
    const { process_qty, balance_qty, is_active } = payload;

    // Validation
    if (!process_qty || process_qty <= 0) {
        throw new Error('Process Qty must be greater than zero');
    }
    if (balance_qty === undefined || balance_qty < 0) {
        throw new Error('Balance Qty cannot be negative');
    }

    // Check exists
    const existing = await pool.query(
        'SELECT * FROM process_order WHERE process_o_no = $1',
        [processONo]
    );
    if (existing.rows.length === 0) {
        throw new Error('Process Order not found');
    }

    // If activating, check no other active order for same material
    const currentOrder = existing.rows[0];
    if (is_active && !currentOrder.is_active) {
        const activeExists = await pool.query(
            'SELECT process_o_no FROM process_order WHERE material_code = $1 AND is_active = true AND process_o_no != $2',
            [currentOrder.material_code, processONo]
        );
        if (activeExists.rows.length > 0) {
            const err = new Error(`An active Process Order (${activeExists.rows[0].process_o_no}) already exists for this material. Deactivate it first.`);
            err.statusCode = 409;
            throw err;
        }
    }

    const result = await pool.query(`
        UPDATE process_order
        SET process_qty = $1, balance_qty = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
        WHERE process_o_no = $4
        RETURNING *
    `, [process_qty, balance_qty, is_active, processONo]);

    return result.rows[0];
};

export const toggleProcessOrderStatusS = async (processONo, is_active) => {
    // If activating, ensure no other active order for same material
    if (is_active) {
        const current = await pool.query(
            'SELECT material_code FROM process_order WHERE process_o_no = $1',
            [processONo]
        );
        if (current.rows.length === 0) {
            throw new Error('Process Order not found');
        }

        const activeExists = await pool.query(
            'SELECT process_o_no FROM process_order WHERE material_code = $1 AND is_active = true AND process_o_no != $2',
            [current.rows[0].material_code, processONo]
        );
        if (activeExists.rows.length > 0) {
            const err = new Error(`Cannot activate. Process Order ${activeExists.rows[0].process_o_no} is already active for this material.`);
            err.statusCode = 409;
            throw err;
        }
    }

    const result = await pool.query(
        'UPDATE process_order SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE process_o_no = $2',
        [is_active, processONo]
    );

    if (result.rowCount === 0) {
        throw new Error('Process Order not found');
    }

    return { success: true, message: `Process Order ${is_active ? 'activated' : 'deactivated'} successfully` };
};
