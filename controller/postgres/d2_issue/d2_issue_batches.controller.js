import { getD2IssueBatchesS, getD2BatchGradeExportS } from "../../../services/d2_issue/d2_issue_batches.service.js";

export const getD2IssueBatchesC = async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: "Both 'from' and 'to' query parameters are required (YYYY-MM-DD)"
            });
        }

        const data = await getD2IssueBatchesS(from, to);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get D2 Issue Batches Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getD2BatchGradeExportC = async (req, res) => {
    try {
        const { d2_batch_id } = req.params;

        if (!d2_batch_id) {
            return res.status(400).json({
                success: false,
                message: "d2_batch_id parameter is required"
            });
        }

        const data = await getD2BatchGradeExportS(d2_batch_id);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get D2 Batch Grade Export Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
