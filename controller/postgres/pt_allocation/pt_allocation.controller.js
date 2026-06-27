import { createPtAllocationS,getPTAllocatedSpoolS } from "../../../services/pt_allocation/pt_allocation.service.js";

export const createPtAllocationC = async(req,res)=>{
    try{
        const ptAllocationEntry = await createPtAllocationS(req.body);

        res.status(201).json({
            success: true,
            message: "PT Allocation Created Successfully",
            data: ptAllocationEntry
        });
    } catch (error) {
        console.error("Create PT Allocation Error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const getPTAllocatedSpoolC = async(req,res)=>{
    try{
        const {is_pt_complete} = req.query;

        const flag = 
        is_pt_complete === "true" ? true :
        is_pt_complete === "false" ? false :
        null;

        if (flag === null){
            return res.status(400).json({
                success: false,
                message: "is_reject must be true or false"
            });
        }

        const data = await getPTAllocatedSpoolS(flag);

        return res.status(200).json({
            success: true,
            data
        });

    }catch(error){
         return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}