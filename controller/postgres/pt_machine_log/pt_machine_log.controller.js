import { getByBobbinNoS } from "../../../services/pt_machine_log/pt_machine_log.service.js";

export const getByBobbinNoC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await getByBobbinNoS(bobbin_no);

        if (!result) {
            return res.status(404).json({ success: false, message: "No machine log found for this bobbin." });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
