import { getBobbinByBarcodeS, saveTempEntryS, checkExistingTempEntryS, updateTempEntryS } from "../../../services/temp_entry/temp_entry.service.js";

export const getBobbinByBarcodeC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await getBobbinByBarcodeS(bobbin_no);

        if (!result) {
            return res.status(404).json({ success: false, message: "Bobbin not found for this Barcode ID" });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkExistingTempEntryC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await checkExistingTempEntryS(bobbin_no);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveTempEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const temp_entry_id = await saveTempEntryS({ ...req.body, logged_in_user: emp_id });

        res.status(201).json({ success: true, message: "Temp Entry saved successfully", temp_entry_id });
    } catch (error) {
        console.error("Temp Entry Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to save temp entry" });
    }
};

export const updateTempEntryC = async (req, res) => {
    try {
        const { id } = req.params;
        const emp_id = req.user.emp_id;
        const result = await updateTempEntryS(id, { ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
