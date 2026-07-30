import {
    getPackingOrdersS, loadPackingOrderS, saveTcS, listTcS, getTcByIdS
} from "../../../services/tc_generation/tc_generation.service.js";

// GET /api/tc/packing-orders
export const getPackingOrdersC = async (req, res) => {
    try {
        const data = await getPackingOrdersS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/tc/load/:orderNo
export const loadPackingOrderC = async (req, res) => {
    try {
        const { orderNo } = req.params;
        const data = await loadPackingOrderS(orderNo);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'Packing Order not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/tc/save
export const saveTcC = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || null;
        const result = await saveTcS(req.body, userId);
        res.status(201).json({ success: true, message: 'Test Certificate saved successfully', data: result });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'TC Number already exists' });
        }
        if (error.message === 'TC Number is required' || error.message === 'Packing Order is required' || error.message === 'TC already generated for this order') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/tc
export const listTcC = async (req, res) => {
    try {
        const data = await listTcS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/tc/:tcId
export const getTcByIdC = async (req, res) => {
    try {
        const { tcId } = req.params;
        const data = await getTcByIdS(tcId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'TC not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
