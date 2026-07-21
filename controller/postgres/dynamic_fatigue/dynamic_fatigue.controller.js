import { getDynamicFatigueListS, getDynamicFatigueByIdS, createDynamicFatigueS, updateDynamicFatigueS } from "../../../services/dynamic_fatigue/dynamic_fatigue.service.js";

export const getDynamicFatigueListC = async (req, res) => {
    try {
        const result = await getDynamicFatigueListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDynamicFatigueByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getDynamicFatigueByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "Dynamic Fatigue entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDynamicFatigueC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createDynamicFatigueS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create Dynamic Fatigue Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDynamicFatigueC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateDynamicFatigueS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update Dynamic Fatigue Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
