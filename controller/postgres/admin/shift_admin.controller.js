import { createShiftAdminS, updateShiftAdminS } from "../../../services/admin/shift_admin.service.js";

export const createShiftC = async (req, res) => {
    try {
        const result = await createShiftAdminS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateShiftC = async (req, res) => {
    try {
        const { shift_id } = req.params;
        const result = await updateShiftAdminS(shift_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
