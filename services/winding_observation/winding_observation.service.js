import pool from "../../db/postgres.js";

export const createWindingObsS = async(data)=>{
    const {w_o_name} = data;

    const query = `
    INSERT INTO winding_observation (w_o_name)
    VALUES ($1)
    RETURNING *;
    `;

    const values = [w_o_name];

    const result = await pool.query(query,values);
    return result.rows[0];
};

export const getWindingObsS = async()=>{
    const query = `
    SELECT * FROM
    winding_observation
    ORDER BY wind_obs_id DESC;
    `;

    const result = await pool.query(query);
    return result.rows; 
}