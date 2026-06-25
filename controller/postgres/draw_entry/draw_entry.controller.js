import { drawEntryS, getDrawEntryDataForPTAS } from "../../../services/draw_entry/draw_entry.service.js";

export const drawEntryC = async(req,res)=>{
    try{
        const payload = req.body;

        const result = await drawEntryS(payload);

        return res.status(200).json({
            success:true,
            message:result.message,
            data:result
        });
    }catch(error){
        console.error("Draw Entry Error:",error);

        return res.status(500).json({
      success: false,
      message: error.message || "Failed to create draw entry"
    });
    }
}

export const getDrawEntryDataForPTAC = async (req, res) => {
    try {
        const { spool_id } = req.query;

        if (!spool_id) {
            return res.status(400).json({
                success: false,
                message: "spool_id is required"
            });
        }

        const data = await getDrawEntryDataForPTAS({ spool_id });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "No draw entry found for this spool_id"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Draw entry data fetched successfully",
            data
        });

    } catch (error) {
        console.error("Get Draw Entry PTA Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

