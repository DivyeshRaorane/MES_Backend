import { getOrderForPackingS, validateBobbinForPackingS, submitPackingS, getPackingListHistoryS, getPackingListViewS, deletePackingBobbinS, deletePackingBoxS, addBobbinToPackingS } from "../../../services/packing/packing.service.js";

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

export const getPackingListHistoryC = async (req, res) => {
    try {
        const data = await getPackingListHistoryS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPackingListViewC = async (req, res) => {
    try {
        const { order_no } = req.params;
        const data = await getPackingListViewS(order_no);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === "Packing order not found.") {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePackingBobbinC = async (req, res) => {
    try {
        const { packing_order_bobbin_id } = req.params;
        const result = await deletePackingBobbinS(packing_order_bobbin_id);

        if (!result.success) {
            return res.status(result.status || 404).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePackingBoxC = async (req, res) => {
    try {
        const { order_no, stack_no, box_no } = req.params;
        const result = await deletePackingBoxS(order_no, stack_no, box_no);

        if (!result.success) {
            return res.status(result.status || 404).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, message: result.message, removed_count: result.removed_count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addBobbinToPackingC = async (req, res) => {
    try {
        const { order_no, bobbin_no, stack_no, box_no } = req.body;

        if (!order_no || !bobbin_no || !stack_no || !box_no) {
            return res.status(400).json({ success: false, message: "order_no, bobbin_no, stack_no, and box_no are required" });
        }

        const result = await addBobbinToPackingS(order_no, bobbin_no, stack_no, box_no);

        if (!result.success) {
            return res.status(result.status).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error("Add bobbin to packing error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
