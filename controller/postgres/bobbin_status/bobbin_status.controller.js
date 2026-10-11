import { getBobbinStatusS } from "../../../services/bobbin_status/bobbin_status.service.js";

export const getBobbinStatusC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await getBobbinStatusS(bobbin_no);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Bobbin Status Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
