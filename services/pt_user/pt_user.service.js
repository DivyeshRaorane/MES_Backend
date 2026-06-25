import pool from "../../db/postgres.js";

export const createPTUsersS = async(payload)=>{
    const {emp_id,pt_user_name} = payload;

    const query = `
    INSERT INTO pt_users
    (emp_id,pt_user_name)
    VALUES($1,$2)
    RETURNING *;
    `;

    const values = [emp_id,pt_user_name];

    const result =await pool.query(query,values);
    return result.rows[0]
}

export const getPTUsersS = async()=>{
    
    const query = `
    SELECT * FROM pt_users
    ORDER BY pt_user_id ASC;
    `;

    const result = await pool.query(query);

    return result.rows;
}