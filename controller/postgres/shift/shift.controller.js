import { createShiftS, getAllShiftsS } from "../../../services/shift/shift.service.js";

export const createShiftC = async(req,res)=>{
    try{
        const shift = createShiftS(req.body);

        return res.status(200).json({
            success:true,
            message:"Shift Created Successfully",
            data:shift
        });

    }catch(error){
        console.error(error);

        return res.status(500).json({
            success:false,
            message:"Something Went Wrong With", error
        })
    }
}

export const getAllShiftsC = async(req,res)=>{
    try{

        const shifts = await getAllShiftsS();

        return res.status(200).json({
            success:true,
            message:"Shifts Successfully Gets",
            data:shifts
        });
    }catch(error){
        console.error(error);

        return res.status(500).json({
            success:false,
            message:"Failed to fetch Shifts with:", error
        })
    }
}