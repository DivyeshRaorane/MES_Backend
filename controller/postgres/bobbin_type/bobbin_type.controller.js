import { createBobbinTypeS,getBobbinTypeS } from "../../../services/bobbin_type/bobbin_type.service.js";

export const createBobbinTypeC = async(req,res)=>{
    try{
     const Bobbin_Type = await createBobbinTypeS(req.body);

     res.status(201).json({
        success:true,
        message:"Bobbin Type Successfully Created",
        data:Bobbin_Type
     });
    }catch(error){
        console.error("Create Bobbin Type Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
    }
}

export const getBobbinTypeC = async(req,res)=>{
    try{
         const { is_disable } = req.query;

        const bobbinsType = await getBobbinTypeS(
            is_disable !== undefined ? is_disable === "true" : null
        );

        res.status(200).json({
      success: true,
      data: bobbinsType,
    });
    }catch(error){
        console.error("Get Bobbin Types Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
    }
}