import { getTempEntryListS, getTempEntryByIdS, createTempEntryS, updateTempEntryS } from "../../../services/temp_entry/temp_entry.service.js";

export const getTempEntryListC = async (req, res) => {
    try {
        const result = await getTempEntryListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTempEntryByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getTempEntryByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "Temp entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTempEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createTempEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create Temp Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTempEntryC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateTempEntryS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update Temp Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
