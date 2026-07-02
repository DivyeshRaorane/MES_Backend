import { createPtAllocationS,getPTAllocatedSpoolS, getPTRejectedSpoolS,ptWipS } from "../../../services/pt_allocation/pt_allocation.service.js";

export const createPtAllocationC = async(req,res)=>{
    try{
        const emp_id = req.user.emp_id;
        const ptAllocationEntry = await createPtAllocationS({...req.body, logged_in_user:emp_id});

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


export const getPTRejectedSpoolC = async(req,res)=>{
    try{
        const {is_reject} = req.query;

        const flag = 
        is_reject === "true" ? true :
        is_reject === "false" ? false :
        null;

        if (flag === null){
            return res.status(400).json({
                success: false,
                message: "is_reject must be true or false"
            });
        }

        const data = await getPTRejectedSpoolS(flag);

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


export const ptWipC = async(req,res)=>{
    try{
        const {is_pt_allocate} = req.query;

        const flag = 
        is_pt_allocate === "true" ? true :
        is_pt_allocate === "false" ? false :
        null;

        if (flag === null){
            return res.status(400).json({
                success: false,
                message: "is_pt_allocate must be true or false"
            });
        }

        const data = await ptWipS(flag);

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