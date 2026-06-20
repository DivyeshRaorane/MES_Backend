import axios from "axios";
import pool from "../../db/postgres.js";

export const syncPreformData = async () => {
    try {
        console.log('Fetching data from SAP...');

        const response = await axios({
            method: "GET",
            url: process.env.SAP_API_URL
        })

        const data = response.data;

        for (const item of data) {
            await pool.query(
                `INSERT INTO preform_data (
                preform_id,
                preform_weight,
                preform_type_id,
                material_code,
                material_description,
                plant,
                storage_location,
                uom,
                is_active,
                )
                VALUES(
                $1,$2,$3,$4,$5,$6,$7,'KG',true)
                ON CONFLICT (preform_id)
                DO NOTHING`,
                [
                    item.preform_id,
                    item.preform_weight,
                    item.preform_type_id,
                    item.material_code,
                    item.material_description,
                    item.plant,
                    item.storage_location
                ]
                
            );
        }
        console.log("Sync Completed")
    }catch(error){
        console.error('Sync Error:',error.message);
    }
};

export const createPreformData = async(data) =>{

    

    const {preform_id,
  preform_weight,
  preform_type_id,
  material_code,
  material_description,
  plant,
  storage_location,
  uom} = data;


    const query = `
    INSERT INTO preform_data(
    preform_id,
      preform_weight,
      preform_type_id,
      material_code,
      material_description,
      plant,
      storage_location,
      uom,
      is_active
)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
      RETURNING *;
      `;

       const values = [
    preform_id,
    preform_weight,
    Number(preform_type_id),
    material_code,
    material_description,
    plant,
    storage_location,
    uom || 'KG'
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getPreformsData = async (is_active) => {
  let query = `SELECT * FROM preform_data`;
  let values = [];

  if (is_active !== undefined) {
    query += ` WHERE is_active = $1`;
    values.push(is_active);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, values);
  return result.rows;
};