import { getStackLabelsS } from "../../../services/stack_label/stack_label.service.js";

// POST /api/stack/labels
// Body: { bobbin_nos: string[] }
// Returns: { status, message, data }
export const getStackLabelsC = async (req, res) => {
    try {
        const { bobbin_nos } = req.body || {};
        const result = await getStackLabelsS(bobbin_nos);

        // The service already returns { status, message, data }; reuse its status as HTTP code.
        return res.status(result.status).json(result);
    } catch (error) {
        console.error("Stack Labels Error:", error.message);
        return res.status(500).json({ status: 500, message: error.message, data: [] });
    }
};
