import { getAllOrdersS, createOrderS, updateOrderS } from "../../../services/order/order.service.js";

export const getAllOrdersC = async (req, res) => {
    try {
        const result = await getAllOrdersS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createOrderC = async (req, res) => {
    try {
        const result = await createOrderS(req.body);
        res.status(201).json({ success: true, message: "Order created successfully.", data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateOrderC = async (req, res) => {
    try {
        const { packing_order_id } = req.params;
        const result = await updateOrderS(packing_order_id, req.body);
        res.status(200).json({ success: true, message: "Order updated.", data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
