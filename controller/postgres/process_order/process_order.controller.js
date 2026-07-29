import {
    getAllProcessOrdersS, getProcessOrderByNoS, createProcessOrderS,
    updateProcessOrderS, toggleProcessOrderStatusS, getProcessOrderMaterialsS
} from "../../../services/process_order/process_order.service.js";

export const getAllProcessOrdersC = async (req, res) => {
    try {
        const data = await getAllProcessOrdersS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('[ProcessOrder] GET all error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProcessOrderByNoC = async (req, res) => {
    try {
        const { processONo } = req.params;
        const data = await getProcessOrderByNoS(processONo);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'Process Order not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        console.error('[ProcessOrder] GET by no error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createProcessOrderC = async (req, res) => {
    try {
        const data = await createProcessOrderS(req.body);
        res.status(201).json({ success: true, message: 'Process Order created successfully', data });
    } catch (error) {
        console.error('[ProcessOrder] POST error:', error.message);
        if (error.statusCode === 409 || error.message.includes('already exists')) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('cannot be')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProcessOrderC = async (req, res) => {
    try {
        const { processONo } = req.params;
        const data = await updateProcessOrderS(processONo, req.body);
        res.status(200).json({ success: true, message: 'Process Order updated successfully', data });
    } catch (error) {
        console.error('[ProcessOrder] PUT error:', error.message);
        if (error.message === 'Process Order not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 409) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error.message.includes('must be') || error.message.includes('cannot be')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleProcessOrderStatusC = async (req, res) => {
    try {
        const { processONo } = req.params;
        const { is_active } = req.body;
        const result = await toggleProcessOrderStatusS(processONo, is_active);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Process Order not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.statusCode === 409 || error.message.includes('Cannot activate')) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('[ProcessOrder] PATCH status error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProcessOrderMaterialsC = async (req, res) => {
    try {
        const { processONo } = req.params;
        const data = await getProcessOrderMaterialsS(processONo);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('[ProcessOrder] GET materials error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
