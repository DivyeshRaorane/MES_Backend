import { createFgUserAdminS, updateFgUserAdminS } from "../../../services/admin/fg_user_admin.service.js";

const sendError = (res, error) => {
    // 23505 = unique violation (in case a unique index on emp_id is added later)
    if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "Employee ID already exists", data: null });
    }
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message, data: null });
};

// POST /api/admin/fgusers
export const createFgUserAdminC = async (req, res) => {
    try {
        const result = await createFgUserAdminS(req.body);
        res.status(201).json({ success: true, message: "FG user created successfully", data: result });
    } catch (error) {
        sendError(res, error);
    }
};

// PUT /api/admin/fgusers/:fg_user_id
export const updateFgUserAdminC = async (req, res) => {
    try {
        const { fg_user_id } = req.params;
        const result = await updateFgUserAdminS(fg_user_id, req.body);
        res.status(200).json({ success: true, message: "FG user updated successfully", data: result });
    } catch (error) {
        sendError(res, error);
    }
};
