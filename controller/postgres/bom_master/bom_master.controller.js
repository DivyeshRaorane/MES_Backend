import { getAllBomsS, getBomByMaterialCodeS, createBomS, updateBomS, toggleBomStatusS } from "../../../services/bom_master/bom_master.service.js";

export const getAllBomsC = async (req, res) => {
    try {
        const data = await getAllBomsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('[BOM] GET all error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBomByMaterialCodeC = async (req, res) => {
    try {
        const { materialCode } = req.params;
        const data = await getBomByMaterialCodeS(materialCode);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'BOM not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        console.error('[BOM] GET by code error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createBomC = async (req, res) => {
    try {
        const result = await createBomS(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('[BOM] POST error:', error.message);
        if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error.message.includes('required') || error.message.includes('valid code')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBomC = async (req, res) => {
    try {
        const { materialCode } = req.params;
        const result = await updateBomS(materialCode, req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error('[BOM] PUT error:', error.message);
        if (error.message === 'BOM not found for this product') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes('Duplicate') || error.message.includes('required') || error.message.includes('valid code')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleBomStatusC = async (req, res) => {
    try {
        const { materialCode } = req.params;
        const { is_active } = req.body;
        const result = await toggleBomStatusS(materialCode, is_active);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'BOM not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        console.error('[BOM] PATCH status error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
