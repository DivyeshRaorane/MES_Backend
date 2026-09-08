import {
    getAllOrdersS,
    getOrderByNoS,
    createOrderS,
    updateOrderS,
} from "../../../services/admin_order/admin_order.service.js";

// GET /api/admin/orders
export const getAllOrdersC = async (req, res) => {
    try {
        const data = await getAllOrdersS();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/admin/orders/:orderNo
export const getOrderByNoC = async (req, res) => {
    try {
        const { orderNo } = req.params;
        const data = await getOrderByNoS(orderNo);

        if (!data) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/orders
export const createOrderC = async (req, res) => {
    try {
        const header = req.body?.header;

        // Validate order_no: present and <= 10 chars.
        const orderNo = header?.order_no;
        if (!orderNo || String(orderNo).trim() === "") {
            return res.status(400).json({ success: false, message: "header.order_no is required" });
        }
        if (String(orderNo).length > 10) {
            return res.status(400).json({ success: false, message: "header.order_no must be 10 characters or fewer" });
        }

        const data = await createOrderS(req.body);
        return res.status(201).json({ success: true, message: "Order created successfully.", data });
    } catch (error) {
        if (error.code === "ORDER_EXISTS") {
            return res.status(409).json({ success: false, message: "Order already exists" });
        }
        if (error.code === "INVALID_ORDER_TYPE") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/orders/:orderNo
export const updateOrderC = async (req, res) => {
    try {
        const { orderNo } = req.params;

        if (!orderNo || String(orderNo).length > 10) {
            return res.status(400).json({ success: false, message: "Invalid order_no" });
        }

        const data = await updateOrderS(orderNo, req.body);
        return res.status(200).json({ success: true, message: "Order updated successfully.", data });
    } catch (error) {
        if (error.code === "ORDER_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (error.code === "INVALID_ORDER_TYPE") {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
