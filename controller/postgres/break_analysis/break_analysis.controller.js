import { getPendingBreaksS, getBobbinByFidS, saveBreakAnalysisS } from "../../../services/break_analysis/break_analysis.service.js";

export const getPendingBreaksC = async (req, res) => {
    try {
        const result = await getPendingBreaksS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBobbinByFidC = async (req, res) => {
    try {
        const { fid } = req.params;
        const result = await getBobbinByFidS(fid);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveBreakAnalysisC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await saveBreakAnalysisS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Break Analysis Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
