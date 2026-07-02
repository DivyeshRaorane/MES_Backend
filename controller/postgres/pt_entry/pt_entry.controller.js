import { ptEntryS, getSpoolDetailsForPtEntryS, getPTFlawsS, getPTLogsS } from "../../../services/pt_entry/pt_entry.service.js";

export const ptEntryC = async(req,res)=>{
    try{

        console.log("REQUEST",req.body)
        const emp_id = req.user.emp_id;
        const result = await ptEntryS({...req.body, logged_in_user:emp_id});

        return res.status(200).json({
            success:true,
            message:"PT Entry Successfully Done",
            data:result
        })
    }catch(error){
        console.error("PT Entry Error:",error);

        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

export const getSpoolDetailsForPtEntryC = async(req,res)=> {
try{
    const { spool_id } = req.params;

    const data = await getSpoolDetailsForPtEntryS(spool_id);

    res.status(200).json({
      success: true,
      data,
    });
}catch(error){
    res.status(404).json({
      success: false,
      message: error.message,
    });
}
}


export const getPTFlawsC = async(req,res)=>{
    try{
        const {spool_id} = req.query;

        const flawDetails = await getPTFlawsS(spool_id);

        res.status(200).json({
            success: true,
            message: "PT flaw details fetched successfully.",
            data: flawDetails
        });
    }catch(error){
        console.error("Get PT Flaw Details Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

export const getPTLogsC = async(req,res)=>{
    try{
        const {spool_id} = req.query;

        const ptLogs = await getPTLogsS(spool_id);

        res.status(200).json({
            success: true,
            message: "PT Logs details fetched successfully.",
            data: ptLogs
        });
    }catch(error){
        console.error("Get PT Logs Details Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}