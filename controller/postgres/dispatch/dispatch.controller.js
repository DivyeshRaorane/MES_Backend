import { getTcByNumberS, markDispatchedS } from "../../../services/dispatch/dispatch.service.js";

export const getTcC = async (req, res) => {
    try {
        const { tc_number } = req.params;
        const result = await getTcByNumberS(tc_number);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, header: result.header, details: result.details });
    } catch (error) {
        console.error("Get TC Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markDispatchedC = async (req, res) => {
    try {
        const { tc_id } = req.body;

        if (!tc_id) {
            return res.status(400).json({ success: false, message: "tc_id is required" });
        }

        const result = await markDispatchedS(tc_id);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.status(200).json({
            success: true,
            message: result.message,
            dispatched_count: result.dispatched_count
        });
    } catch (error) {
        console.error("Mark Dispatched Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
