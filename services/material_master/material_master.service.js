import pool from "../../db/postgres.js";

export const createMaterialMasterS = async(payload)=>{
    const query = `
    INSERT INTO material_master(
    material_code,
    material_category,
    material_description,
    preform_type,
    product_type,
    uom,
    is_sample,
    is_active
    )
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;
    `;

    const values = [
        payload.material_code,
        payload.material_category,
        payload.material_description,
        payload.preform_type,
        payload.product_type,
        payload.uom,
        payload.is_sample,
        payload.is_active
    ];

    const result = await pool.query(query,values);

    return result.rows[0];
}

export const getMaterialMasterS = async(queryParams = {})=>{
let query = `
SELECT * FROM material_master`;
const values = [];

if (queryParams.material_code) {
        query += ` WHERE material_code = $1`;
        values.push(queryParams.material_code);
    } else if (queryParams.material_description) {
        query += ` WHERE material_description = $1`;
        values.push(queryParams.material_description);
    } else if (queryParams.material_category) {
        query += ` WHERE material_category = $1`;
        values.push(queryParams.material_category);
    } else if (queryParams.preform_type) {
        query += ` WHERE preform_type = $1`;
        values.push(queryParams.preform_type);
    } else if (queryParams.product_type) {
        query += ` WHERE product_type = $1`;
        values.push(queryParams.product_type);
    }

    query += ` ORDER BY material_code ASC`;

    const result = await pool.query(query, values);
    return result.rows;
};


