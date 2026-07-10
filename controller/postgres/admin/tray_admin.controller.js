import { getAllTraysS, createTrayS, deactivateTrayS, getPositionsS, addPositionsS, removePositionsS } from "../../../services/admin/tray_admin.service.js";

export const getAllTraysC = async (req, res) => {
    try {
        const result = await getAllTraysS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTrayC = async (req, res) => {
    try {
        const result = await createTrayS(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deactivateTrayC = async (req, res) => {
    try {
        const { tray_id } = req.params;
        const result = await deactivateTrayS(tray_id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPositionsC = async (req, res) => {
    try {
        const { tray_id } = req.params;
        const result = await getPositionsS(tray_id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addPositionsC = async (req, res) => {
    try {
        const { tray_id } = req.params;
        const { count } = req.body;
        const result = await addPositionsS(tray_id, count);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removePositionsC = async (req, res) => {
    try {
        const { tray_id } = req.params;
        const { count } = req.body;
        const result = await removePositionsS(tray_id, count);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
