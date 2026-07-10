import { validateBobbinForQcOutS, submitQcOutS } from "../../../services/qc_out/qc_out.service.js";

export const validateQcOutC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await validateBobbinForQcOutS(bobbin_no);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitQcOutC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await submitQcOutS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("QC Out Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
