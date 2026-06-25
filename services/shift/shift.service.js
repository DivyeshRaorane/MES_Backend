import pool from "../../db/postgres.js";

export const createShiftS = async(shiftData)=>{
    const {shift_name, shift_start_time,shift_end_time} = shiftData;

    const query = `
    INSERT INTO shifts(
    shift_name,
    shift_start_time,
    shift_end_time)
    VALUES ($1,$2,$3)
    RETURNING * ;
    `;

    const values = [
        shift_name,
        shift_start_time,
        shift_end_time
    ]

    const result = await pool.query(query,values);

    return result.rows[0];
};

export const getAllShiftsS = async()=>{
const query = `
SELECT * FROM shifts
ORDER BY shift_id;
`;

const result = await pool.query(query);

return result.rows;
}