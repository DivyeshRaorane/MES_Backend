import { submitQcFinalGradeS, submitQcFinalGradeBulkS } from "../../../services/qc_entry/qc_final_grade.service.js";

// Single bobbin final-grade promotion (scan bobbin_no -> Final Entry button)
export const submitQcFinalGradeC = async (req, res) => {
    try {
        const { bobbin_no } = req.body;

        if (!bobbin_no) {
            return res.status(400).json({ success: false, message: "bobbin_no is required." });
        }

        const result = await submitQcFinalGradeS(bobbin_no);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("[SubmitQcFinalGrade] Controller Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk final-grade promotion (multiple scanned bobbins)
export const submitQcFinalGradeBulkC = async (req, res) => {
    try {
        const { bobbin_nos } = req.body;

        if (!Array.isArray(bobbin_nos) || bobbin_nos.length === 0) {
            return res.status(400).json({
                success: false,
                message: "bobbin_nos must be a non-empty array.",
            });
        }

        const result = await submitQcFinalGradeBulkS(bobbin_nos);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("[SubmitQcFinalGradeBulk] Controller Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
