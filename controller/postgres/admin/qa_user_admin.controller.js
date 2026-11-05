import { createQaUserAdminS, updateQaUserAdminS } from "../../../services/admin/qa_user_admin.service.js";

const sendError = (res, error) => {
    // 23505 = unique violation (in case a unique index on emp_id is added later)
    if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "Employee ID already exists", data: null });
    }
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message, data: null });
};

// POST /api/admin/qausers
export const createQaUserAdminC = async (req, res) => {
    try {
        const result = await createQaUserAdminS(req.body);
        res.status(201).json({ success: true, message: "QA user created successfully", data: result });
    } catch (error) {
        sendError(res, error);
    }
};

// PUT /api/admin/qausers/:qa_user_id
export const updateQaUserAdminC = async (req, res) => {
    try {
        const { qa_user_id } = req.params;
        const result = await updateQaUserAdminS(qa_user_id, req.body);
        res.status(200).json({ success: true, message: "QA user updated successfully", data: result });
    } catch (error) {
        sendError(res, error);
    }
};
