import { createDrawUserS, getAllDrawUsersS } from "../../../services/draw_user/draw_user.service.js";

export const createDrawUserC = async(req,res)=>{
    try{

        const user = await createDrawUserS(req.body);

        return res.status(200).json({
            success:true,
            message:"Draw User Successfully Created",
            data:user
        });
    }catch(error){
        console.error(error);

        return res.status(500).json({
            success:false,
            message:"Something Went Wrong With:",error
        })
    }
}

export const getAllDrawUsersC = async(req,res)=>{
    try{

        const drawUsers = await getAllDrawUsersS();

        return res.status(200).json({
            success:true,
            message:"Draw Users Successfully Get",
            data:drawUsers 
        })
    }catch(error){
        console.error(error);

        return res.status(500).json({
            success:false,
            message:"Something Went Wrong:", error
        })
    }
}