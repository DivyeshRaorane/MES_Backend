import { createQcUserS, getAllQcUsersS } from "../../../services/qc_user/qc_user.service.js";

export const createQcUserC = async (req, res) => {
    try {
        const result = await createQcUserS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllQcUsersC = async (req, res) => {
    try {
        const result = await getAllQcUsersS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
