import { getFilteredFiberCutReasonsS } from "../../../services/fiber_cut_reasons/fiber_cut_reasons.service.js";

// GET /api/fiber-cut-reasons?indication_id=X
export const getFilteredFiberCutReasonsC = async (req, res) => {
    try {
        const { indication_id } = req.query;
        const data = await getFilteredFiberCutReasonsS(indication_id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};
