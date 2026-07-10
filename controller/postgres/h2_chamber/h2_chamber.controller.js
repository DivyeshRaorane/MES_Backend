import { createH2ChamberS, getH2ChambersByStatusS } from "../../../services/h2_chamber/h2_chamber.service.js";

export const createH2ChamberC = async (req, res) => {
    try {
        const result = await createH2ChamberS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getH2ChambersC = async (req, res) => {
    try {
        const { is_active } = req.query;

        const flag = is_active === "true" ? true : is_active === "false" ? false : null;

        if (flag === null) {
            return res.status(400).json({ success: false, message: "is_active must be true or false" });
        }

        const result = await getH2ChambersByStatusS(flag);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
