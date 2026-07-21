import { getWiEntryListS, getWiEntryByIdS, createWiEntryS, updateWiEntryS } from "../../../services/water_immersion/water_immersion.service.js";

export const getWiEntryListC = async (req, res) => {
    try {
        const result = await getWiEntryListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWiEntryByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getWiEntryByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "Water Immersion entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createWiEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createWiEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create WI Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWiEntryC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateWiEntryS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update WI Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
