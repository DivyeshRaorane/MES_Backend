import { syncPreformData,createPreformData, getPreformsData } from "../../../services/preform_data/preform_data.service.js";

export const syncNow = async(req,res)=>{
    try{
        await syncPreformData();

        return res.status(200).json({
            success:true,
            message:'Sync Completed'
        });
    }catch(error){
        return res.status(500).json({
            success: false,
            message:error.message
        })
    }
}

export const createPreform = async(req,res)=>{
    try{
        const {
      preform_id,
      preform_weight,
      preform_type_id,
      material_code,
      material_description,
      plant,
      storage_location,
      uom
        } = req.body;

        const result = await createPreformData({
             preform_id,
             preform_weight,
             preform_type_id,
             material_code,
             material_description,
             plant,
             storage_location,
             uom
        });
        
        return res.status(201).json({
            success:true,
            data:result
        });

    }catch(error){
         return res.status(500).json({
      success: false,
      message: error.message
    });
    }

}

export const getPreform = async (req,res)=>{
    try{
        const is_active = true;

        const data = await getPreformsData(is_active);

        return res.status(200).json({
            success:true,
            count: data.length,
            data
        })
    }catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}