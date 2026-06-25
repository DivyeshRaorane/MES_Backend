import pool from "../../db/postgres.js";

export const createDrawUserS = async(data)=>{
    const {emp_id,draw_user_name} = data;

    const query = `
    INSERT INTO draw_users(
    emp_id,draw_user_name)
    VALUES ($1,$2)
    RETURNING *;
    `;

    const values = [emp_id,draw_user_name];

    const result = await pool.query(query,values);

    return result.rows[0];
};

export const getAllDrawUsersS = async()=>{

    const query = `
    SELECT * FROM draw_users
    ORDER BY draw_user_id DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
};