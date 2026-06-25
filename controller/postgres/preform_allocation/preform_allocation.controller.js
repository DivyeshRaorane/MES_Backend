import { getPreformFroAllocationS,preformAllocationEntryS, recentAllocatedPreformsS, preformsByTowersS} from "../../../services/preform_allocation/preform_allocation.service.js";

export const getPreformForAllocationC = async(req,res)=>{
    try{
        const data = await getPreformFroAllocationS(false)

         res.status(200).json({
            success:true,
            message:"Successfully Get Preforms Which is for Allocation",
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

export const preformAllocationEntryC = async(req,res)=>{
    try{
const result = await preformAllocationEntryS(req.body);

res.status(201).json({
      success: true,
      message: "Preform allocated successfully",
      data: result,
    });
    }catch(error){
console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
    }
} 

export const recentAllocatedPreformsC = async(req,res)=>{
    try{
        const result = await recentAllocatedPreformsS();

        res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
    }catch(error){
        console.error("Error fetching current allocations:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  
    }
}

export const preformsByTowersC = async(req,res)=>{
    try{
        const { tower_id}= req.params;

        if (!tower_id) {
            return res.status(400).json({
                success: false,
                message: "tower_id is required"
            });
        }

        const data = await preformsByTowersS(tower_id);

        return res.status(200).json({
            success: true,
            data
        });
    }catch(error){
        console.error("Get Recent Preforms Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}