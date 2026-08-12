import { getAllQcUsersAdminS, createQcUserAdminS, updateQcUserAdminS } from "../../../services/admin/qc_user_admin.service.js";

export const getAllQcUsersAdminC = async (req, res) => {
    try {
        const result = await getAllQcUsersAdminS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createQcUserAdminC = async (req, res) => {
    try {
        const result = await createQcUserAdminS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateQcUserAdminC = async (req, res) => {
    try {
        const { qc_user_id } = req.params;
        const result = await updateQcUserAdminS(qc_user_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
