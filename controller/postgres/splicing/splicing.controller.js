import { getSplicingListS, getSplicingByIdS, createSplicingS, updateSplicingS } from "../../../services/splicing/splicing.service.js";

export const getSplicingListC = async (req, res) => {
    try {
        const result = await getSplicingListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSplicingByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getSplicingByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "Splicing entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSplicingC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createSplicingS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create Splicing Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSplicingC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateSplicingS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update Splicing Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
