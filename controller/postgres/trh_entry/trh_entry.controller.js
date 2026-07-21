import { getTrhEntryListS, getTrhEntryByIdS, createTrhEntryS, updateTrhEntryS } from "../../../services/trh_entry/trh_entry.service.js";

export const getTrhEntryListC = async (req, res) => {
    try {
        const result = await getTrhEntryListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTrhEntryByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getTrhEntryByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "TRH entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTrhEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createTrhEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create TRH Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTrhEntryC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateTrhEntryS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update TRH Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
