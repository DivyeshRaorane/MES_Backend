import pool from "../../db/postgres.js";

export const createPTMachineS = async(payload)=>{
const {pt_machine_no} = payload;

const query = `
INSERT INTO pt_machine
(pt_machine_no)
VALUES($1)
RETURNING *;
`;

const values = [pt_machine_no];
const result = await pool.query(query,values);

return result.rows[0];
}

export const getPTMachinesS = async(is_active = null)=>{
    let query = `SELECT * FROM pt_machine`;
    const params = [];

    if(is_active !== null && is_active !== undefined){
        query += ` WHERE is_active = $1`;
        params.push(is_active);
    }

    const result = await pool.query(query, params);
    return result.rows;
}