import { getAatEntryListS, getAatEntryByIdS, createAatEntryS, updateAatEntryS } from "../../../services/accelerated_ageing/accelerated_ageing.service.js";

export const getAatEntryListC = async (req, res) => {
    try {
        const result = await getAatEntryListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAatEntryByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getAatEntryByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "Accelerated Ageing entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAatEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createAatEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create AAT Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAatEntryC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateAatEntryS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update AAT Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
