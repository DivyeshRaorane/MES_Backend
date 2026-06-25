import pool from "../../db/postgres.js";

export const createDrawFiberCutReasonS = async(data)=>{
    const {dfcr_name} = data;
    
    const query = `
    INSERT INTO d_fiber_cut_reasons
    (dfcr_name)
    VALUES ($1)
    RETURNING *;
    `;

    const values = [dfcr_name];

    const result = await pool.query(query,values);
    return result.rows[0];
};

export const getAllDrawFiberCutReasonsS = async()=>{

    const query = `
    SELECT * FROM d_fiber_cut_reasons
    ORDER BY dfcr_id DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
}