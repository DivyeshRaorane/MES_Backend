import pool from "../../db/postgres.js";

export const getPreformFroAllocationS = async(is_allocate)=>{

    const query = `
    SELECT
      hj.*,
      pa.preform_weight, pa.drawing_length,pa.preform_type_id
    FROM handle_join hj
    INNER JOIN preform_accept pa
      ON hj.preform_id = pa.preform_id
    WHERE hj.is_allocate = $1;
  `;

    const result = await pool.query(query,[is_allocate])

    return result.rows;

}

export const preformAllocationEntryS = async(data)=>{
const client = await pool.connect();

try{
    await client.query("BEGIN");

    const towerResult = await client.query(
      `
      SELECT is_active
      FROM draw_tower
      WHERE tower_id = $1
      `,
      [data.tower_id]
    );

    if (towerResult.rows.length === 0) {
      throw new Error("Tower not found");
    }

    if (towerResult.rows[0].is_active === false) {
      throw new Error("Selected tower is already occupied");
    }

    const allocationQuery = `
    INSERT INTO preform_allocation(
    preform_id,
    allocation_date,
    tower_id,
    shift_id,
    operator_id,
    loaded_by,
    preform_type_id,
    product_type_id,
    process_type_id,
    average_diameter,
    draw_instruction,
    process_remarks,
    logged_in_user
    )
    VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
    )
    RETURNING *;
    `;

    const allocationResult = await client.query(allocationQuery,[
        data.preform_id,
      data.allocation_date,
      data.tower_id,
      data.shift_id,
      data.operator_id,
      data.loaded_by,
      data.preform_type_id,
      data.product_type_id,
      data.process_type_id,
      data.average_diameter,
      data.draw_instruction,
      data.process_remarks,
      data.logged_in_user,
    ])

    await client.query(
        `
        UPDATE draw_tower
        SET is_active = false
        WHERE tower_id = $1`,
        [data.tower_id]
    );

     await client.query(
      `
      UPDATE handle_join
      SET is_allocate = true
      WHERE preform_id = $1
      `,
      [data.preform_id]
    );

    await client.query("COMMIT");

    return allocationResult.rows[0];
}catch(error){
await client.query("ROLLBACK");
throw error
}finally{
    client.release();
}
}

export const recentAllocatedPreformsS = async()=>{
    const query = `
    SELECT 
    pa.allocation_id,
    pa.preform_id,
    pfa.preform_weight,
    pa.tower_id,
    dt.tower_no,
    pa.allocation_date
    FROM preform_allocation pa
    INNER JOIN preform_accept pfa
    ON pa.preform_id = pfa.preform_id
    LEFT JOIN draw_tower dt
    ON pa.tower_id = dt.tower_id
    WHERE pa.tower_id IS NOT NULL
    AND pa.preform_draw = false
    ORDER BY pa.created_at DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
}