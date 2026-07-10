import { getWiByBarcodeS, saveWiEntryS } from "../../../services/water_immersion/water_immersion.service.js";

export const getWiByBarcodeC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await getWiByBarcodeS(bobbin_no);

        if (!result) {
            return res.status(404).json({ success: false, message: "Bobbin not found for this Barcode ID" });
        }

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveWiEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await saveWiEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Water Immersion Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
