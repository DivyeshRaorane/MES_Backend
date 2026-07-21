import { getHthaEntryListS, getHthaEntryByIdS, createHthaEntryS, updateHthaEntryS } from "../../../services/htha_entry/htha_entry.service.js";

export const getHthaEntryListC = async (req, res) => {
    try {
        const result = await getHthaEntryListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHthaEntryByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getHthaEntryByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "HTHA entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createHthaEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createHthaEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create HTHA Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateHthaEntryC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateHthaEntryS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update HTHA Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
