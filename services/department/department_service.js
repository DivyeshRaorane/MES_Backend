import pool from "../../db/postgres.js";


export const createDepartmentService = async(d_name)=>{
    const result = await pool.query(
        `INSERT INTO departments (d_name)
        VALUES ($1)
        RETURNING id, d_name, created_at`,
        [d_name]
    );

    return result.rows[0]
}