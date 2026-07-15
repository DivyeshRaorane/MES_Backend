import { runAllocationS } from "../../../services/customer_allocation/customer_allocation.service.js";

export const runAllocationC = async (req, res) => {
    try {
        const { spec_ids } = req.body;

        if (!spec_ids || !spec_ids.length) {
            return res.status(400).json({ success: false, message: "No specifications selected" });
        }

        const result = await runAllocationS(spec_ids);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Allocation error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
