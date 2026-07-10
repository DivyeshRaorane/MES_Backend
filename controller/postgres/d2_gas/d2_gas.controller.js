import { getChambersInUseS, getRunningBatchS, submitGasEntryS } from "../../../services/d2_gas/d2_gas.service.js";

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
            return res.status(404).json({ success: false, message: "No active D2 batch is currently running in the selected chamber." });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitGasEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        await submitGasEntryS({ ...req.body, logged_in_user: emp_id });

        res.status(201).json({ success: true, message: "D2 Gas Entry saved successfully." });
    } catch (error) {
        console.error("D2 Gas Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
