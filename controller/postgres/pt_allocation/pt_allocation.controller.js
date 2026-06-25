import { createPtAllocationS } from "../../../services/pt_allocation/pt_allocation.service.js";

export const createPtAllocationC = async(req,res)=>{
    try{
        const ptAllocationEntry = await createPtAllocationS(req.body);

        res.status(201).json({
            success: true,
            message: "PT Allocation Created Successfully",
            data: ptAllocationEntry
        });
    } catch (error) {
        console.error("Create PT Allocation Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to Create PT Allocation", error,
        });
    }
}