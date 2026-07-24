import pool from "../../db/postgres.js";

// ─── Material Master ───
export const getAllMaterialsS = async () => {
    const result = await pool.query(`SELECT * FROM material_master ORDER BY created_at DESC`);
    return result.rows;
};

export const createMaterialS = async (data) => {
    const { material_code, material_category, material_description, preform_type, product_type, uom, is_sample, is_active } = data;
    const result = await pool.query(
        `INSERT INTO material_master (material_code, material_category, material_description, preform_type, product_type, uom, is_sample, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [material_code, material_category, material_description, preform_type, product_type, uom, is_sample || false, is_active !== false]
    );
    return result.rows[0];
};

export const updateMaterialS = async (material_code, data) => {
    const { material_category, material_description, preform_type, product_type, uom, is_sample, is_active } = data;
    const result = await pool.query(
        `UPDATE material_master SET material_category=$1, material_description=$2, preform_type=$3, product_type=$4, uom=$5, is_sample=$6, is_active=$7, updated_at=NOW()
         WHERE material_code = $8 RETURNING *`,
        [material_category, material_description, preform_type, product_type, uom, is_sample, is_active, material_code]
    );
    return result.rows[0];
};

// ─── Process Type ───
export const getAllProcessTypesS = async () => {
    const result = await pool.query(`SELECT * FROM process_type_master ORDER BY process_type_id ASC`);
    return result.rows;
};

export const createProcessTypeS = async (data) => {
    const { process_type, is_active } = data;
    const result = await pool.query(
        `INSERT INTO process_type_master (process_type, is_active) VALUES ($1,$2) RETURNING *`,
        [process_type, is_active !== false]
    );
    return result.rows[0];
};

export const updateProcessTypeS = async (process_type_id, data) => {
    const { process_type, is_active } = data;
    const result = await pool.query(
        `UPDATE process_type_master SET process_type=$1, is_active=$2 WHERE process_type_id=$3 RETURNING *`,
        [process_type, is_active, process_type_id]
    );
    return result.rows[0];
};

// ─── Preform Process Type Mapping ───
export const getMappingsS = async (process_type_id) => {
    const result = await pool.query(
        `SELECT * FROM preform_process_type_mapping WHERE process_type_id = $1 ORDER BY mapping_id ASC`,
        [process_type_id]
    );
    return result.rows;
};

export const createMappingS = async (process_type_id, data) => {
    const { preform_type } = data;

    // Validate preform_type exists in material_master and is active
    const matCheck = await pool.query(
        `SELECT material_code, is_active FROM material_master WHERE preform_type = $1 LIMIT 1`,
        [preform_type]
    );

    if (matCheck.rows.length === 0) {
        throw { code: 'NOT_FOUND', message: `Preform type "${preform_type}" not found in Material Master.` };
    }

    if (matCheck.rows[0].is_active === false) {
        throw { code: 'INACTIVE', message: `Preform type "${preform_type}" is inactive in Material Master.` };
    }

    const result = await pool.query(
        `INSERT INTO preform_process_type_mapping (preform_type, process_type_id) VALUES ($1,$2) RETURNING *`,
        [preform_type, process_type_id]
    );
    return result.rows[0];
};

export const deleteMappingS = async (mapping_id) => {
    await pool.query(`DELETE FROM preform_process_type_mapping WHERE mapping_id = $1`, [mapping_id]);
};

export const getProcessTypesByPreformS = async (preform_type) => {
    const result = await pool.query(
        `SELECT pt.process_type_id, pt.process_type
         FROM preform_process_type_mapping m
         JOIN process_type_master pt ON pt.process_type_id = m.process_type_id
         WHERE m.preform_type = $1 AND pt.is_active = TRUE
         ORDER BY pt.process_type ASC`,
        [preform_type]
    );
    return result.rows;
};
