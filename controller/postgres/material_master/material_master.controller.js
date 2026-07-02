import { createMaterialMasterS, getMaterialMasterS } from "../../../services/material_master/material_master.service.js";

export const createMaterialMasterC = async(req,res)=>{
    try{
        const material = await createMaterialMasterS(req.body);

        return res.status(201).json({
            success: true,
            message: "Material created successfully.",
            data: material
        });
    }catch(error){
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const getMaterialMasterC = async(req,res)=>{
    try{
        
        const data = await getMaterialMasterS(req.query);

           return res.status(200).json({
            success: true,
            data
        });

    }catch(error){
        console.error(error)

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}