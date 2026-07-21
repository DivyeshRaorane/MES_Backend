import { getHotWaterEntryListS, getHotWaterEntryByIdS, createHotWaterEntryS, updateHotWaterEntryS } from "../../../services/hot_water_entry/hot_water_entry.service.js";

export const getHotWaterEntryListC = async (req, res) => {
    try {
        const result = await getHotWaterEntryListS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHotWaterEntryByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getHotWaterEntryByIdS(id);
        if (!result) return res.status(404).json({ success: false, message: "Hot Water entry not found." });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createHotWaterEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createHotWaterEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Create Hot Water Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateHotWaterEntryC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateHotWaterEntryS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        console.error("Update Hot Water Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
