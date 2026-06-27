import { ptEntryS, getSpoolDetailsForPtEntryS } from "../../../services/pt_entry/pt_entry.service.js";

export const ptEntryC = async(req,res)=>{
    try{
        console.log("What is the data for ptentry:", req.body)
        const result = await ptEntryS(req.body);

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
