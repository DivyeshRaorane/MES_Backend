import { getPreformForHandleJ,handleJoinS } from "../../../services/handle_join/handle_join.service.js";


export const getPreformForHandleJoin = async(req,res)=>{
    try{
        const data = await getPreformForHandleJ(false);

        res.status(200).json({
            success:true,
            message:"Successfully Get Preform Which is for Handle Join",
            data,
        });
    }catch(error){
        console.error(error);
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

export const handleJoinC = async(req,res)=>{
    try{
        const data = await handleJoinS(req.body);

        res.status(200).json({
            success:true,
            message:"Handle Join Successfully",
            data:data
        });

    }catch(error){
        console.error(error);
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}