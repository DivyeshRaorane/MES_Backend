import { validateBobbinQC } from "../../../services/qc_entry/qc_grade.service.js";

export const validateBobbinGradeC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await validateBobbinQC(bobbin_no);

        if (result.status === 'ERROR' || result.status === 'CRITICAL_ERROR') {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("QC Grade Validation Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
