import { getChambersInUseS, getRunningBatchS, completeReceivingS } from "../../../services/d2_receiving/d2_receiving.service.js";

export const getChambersInUseC = async (req, res) => {
    try {
        const result = await getChambersInUseS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRunningBatchC = async (req, res) => {
    try {
        const { chamber_no } = req.params;
        const result = await getRunningBatchS(chamber_no);

        if (!result) {
            return res.status(404).json({ success: false, message: "No active D2 batch is running in the selected chamber." });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const completeReceivingC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await completeReceivingS({ ...req.body, logged_in_user: emp_id });

        res.status(200).json(result);
    } catch (error) {
        console.error("D2 Receiving Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
