import { getCycleByBarcodeS, saveCycleEntryS } from "../../../services/temp_cycle_entry/temp_cycle_entry.service.js";

export const getCycleByBarcodeC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await getCycleByBarcodeS(bobbin_no);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveCycleEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await saveCycleEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Temp Cycle Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
