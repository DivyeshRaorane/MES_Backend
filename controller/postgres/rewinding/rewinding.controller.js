import { scanForRewindingS, saveRewindingS } from "../../../services/rewinding/rewinding.service.js";

export const scanRewindingC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await scanForRewindingS(bobbin_no);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveRewindingC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await saveRewindingS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Rewinding Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
