import pool from "../../db/postgres.js";

/**
 * Materials for the material-code dropdowns on the Order admin screens.
 * Returns { material_code, material_description } from material_master.
 * If a category is supplied, filter by material_master.material_category.
 */
export const getMaterialsForDropdownS = async (category) => {
    let query = `
        SELECT material_code, material_description
        FROM material_master`;
    const values = [];

    if (category !== undefined && category !== null && String(category).trim() !== "") {
        query += ` WHERE material_category = $1`;
        values.push(category);
    }

    query += ` ORDER BY material_code ASC`;

    const result = await pool.query(query, values);
    return result.rows;
};
