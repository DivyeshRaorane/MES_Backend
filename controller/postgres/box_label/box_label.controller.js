import { getBoxLabelsS } from "../../../services/box_label/box_label.services.js";

// POST /api/box/labels
// Body: { box_nos: (string|number)[] }  (a single box_no is also accepted)
// Returns: { status, message, data }
export const getBoxLabelsC = async (req, res) => {
    try {
        const { box_nos, box_no } = req.body || {};
        const result = await getBoxLabelsS(box_nos ?? box_no);

        // The service already returns { status, message, data }; reuse its status as HTTP code.
        return res.status(result.status).json(result);
    } catch (error) {
        console.error("Box Labels Error:", error.message);
        return res.status(500).json({ status: 500, message: error.message, data: [] });
    }
};
