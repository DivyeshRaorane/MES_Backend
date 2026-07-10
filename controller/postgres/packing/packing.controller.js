import { getOrderForPackingS, validateBobbinForPackingS, submitPackingS } from "../../../services/packing/packing.service.js";

export const getOrderC = async (req, res) => {
    try {
        const { order_no } = req.params;
        const result = await getOrderForPackingS(order_no);

        if (!result) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const validateBobbinC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const { order_no } = req.query;

        const result = await validateBobbinForPackingS(bobbin_no, order_no);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitPackingC = async (req, res) => {
    try {
        const result = await submitPackingS(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error("Packing Submit Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
