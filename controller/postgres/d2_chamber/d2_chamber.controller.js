import { createD2ChamberS, getAllD2ChambersS } from "../../../services/d2_chamber/d2_chamber.service.js";

export const createD2ChamberC = async (req, res) => {
    try {
        const result = await createD2ChamberS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllD2ChambersC = async (req, res) => {
    try {
        const result = await getAllD2ChambersS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
