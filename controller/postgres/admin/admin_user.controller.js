import { getAllUsersS, getDepartmentsS, createDepartmentS, updateDepartmentS, createUserS, updateUserS, changeUserStatusS } from "../../../services/admin/admin_user.service.js";

export const getAllUsersC = async (req, res) => {
    try {
        const result = await getAllUsersS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDepartmentsC = async (req, res) => {
    try {
        const result = await getDepartmentsS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDepartmentC = async (req, res) => {
    try {
        const result = await createDepartmentS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDepartmentC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateDepartmentS(id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createUserC = async (req, res) => {
    try {
        const result = await createUserS(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error("Create User Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUserC = async (req, res) => {
    try {
        const { emp_id } = req.params;
        const result = await updateUserS(emp_id, req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error("Update User Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const changeStatusC = async (req, res) => {
    try {
        const { emp_id } = req.params;
        const { is_active } = req.body;
        const result = await changeUserStatusS(emp_id, is_active);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
