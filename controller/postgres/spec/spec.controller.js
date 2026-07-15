import { getSpecListS, getSpecByIdS, createSpecS, updateSpecS, deactivateSpecS } from "../../../services/spec/spec.service.js";

export const getSpecListC = async (req, res) => {
    try {
        const result = await getSpecListS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSpecByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getSpecByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "Spec not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSpecC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createSpecS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create Spec Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSpecC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateSpecS(id, req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error("Update Spec Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deactivateSpecC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deactivateSpecS(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
