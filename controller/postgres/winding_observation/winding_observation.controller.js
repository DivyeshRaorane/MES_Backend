import { createWindingObsS, getWindingObsS } from "../../../services/winding_observation/winding_observation.service.js";

export const createWindingObsC = async(req,res)=>{
    try{
        const createWindObs = await createWindingObsS(req.body);

         return res.status(200).json({
            success:true,
            message:"Winding Observation Created Successfully",
            data:createWindObs
        });
    }catch(error){
        console.error(error);

        return res.status(500).json({
            success:false,
            message:"Something Went Wrong With", error
        })
    }
}

export const getAllWindingObsC = async(req,res)=>{
    try{

        const getAllWindObs = await getWindingObsS();

        return res.status(200).json({
            success:true,
            message:"Winding Observation Successfully Gets",
            data:getAllWindObs
        });
    }catch(error){
        console.error(error);

        return res.status(500).json({
            success:false,
            message:"Failed to fetch Winding Observation with:", error
        })
    }
}