import { createBobbinColorS, getBobbinColorS, updateBobbinColorS } from "../../../services/bobbin_color/bobbin_color.service.js";

export const createBobbinColorC = async(req,res)=>{
    try{
     const Bobbin_Color = await createBobbinColorS(req.body);

     res.status(201).json({
        success:true,
        message:"Bobbin Color Successfully Created",
        data:Bobbin_Color
     });
    }catch(error){
        console.error("Create Bobbin Color Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
    }
}

export const getBobbinColorC = async(req,res)=>{
    try{
         const { is_disable } = req.query;

        const bobbinsColor = await getBobbinColorS(
            is_disable !== undefined ? is_disable === "true" : null
        );

        res.status(200).json({
      success: true,
      data: bobbinsColor,
    });
    }catch(error){
        console.error("Get Bobbin Color Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
    }
}

export const updateBobbinColorC = async(req,res)=>{
    try{
        const { bobbin_color_id } = req.params;
        const { bobbin_color_name, is_disable } = req.body;

        const updatedColor = await updateBobbinColorS(bobbin_color_id, { bobbin_color_name, is_disable });

        if (!updatedColor) {
            return res.status(404).json({
                success: false,
                message: "Bobbin Color not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Updated successfully",
            data: updatedColor
        });
    }catch(error){
        console.error("Update Bobbin Color Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}