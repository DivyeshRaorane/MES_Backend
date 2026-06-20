import pool from "../../db/postgres.js";


export const preformAccept = async({
    preform_id,
    preform_weight,
    charge_weight,
    preform_length,
    charge_length,
    drawing_length,
    material_code,
    dia_variation,
    cut_off,
    mfd,
    accepted_by,
    preform_type_id,
    material_description,
    remarks,
    draw_instruction,
    acceptance_status,
    rejection_note,
    logged_in_user
})=>{

    const client = await pool.connect();

    try{
        await client.query("BEGIN");

        const insertQuery = `
        INSERT INTO preform_accept(
        preform_id,
    preform_weight,
    charge_weight,
    preform_length,
    charge_length,
    drawing_length,
    material_code,
    dia_variation,
    cut_off,
    mfd,
    accepted_by,
    preform_type_id,
    material_description,
    remarks,
    draw_instruction,
    acceptance_status,
    rejection_note,
    logged_in_user
        )
    VALUES(
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *
        `;
        const values = [
            preform_id,
    preform_weight,
    charge_weight,
    preform_length,
    charge_length,
    drawing_length,
    material_code,
    dia_variation,
    cut_off,
    mfd,
    accepted_by,
    preform_type_id,
    material_description,
    remarks,
    draw_instruction,
    acceptance_status,
    rejection_note,
    logged_in_user,
        ];

        const result = await client.query(insertQuery,values);

        await client.query(
            `UPDATE preform_data
            SET is_active = false
            WHERE preform_id = $1`,
            [preform_id]
        );

        await client.query("COMMIT")

        return result.rows[0]
    }catch(error){
        await client.query("ROLLBACK");
        throw error
    }finally{
        client.release()
    }

};