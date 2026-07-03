import { getBobbinForPvS, updateBobbinColorS, pvEntryS, getBobbinForRePvS, rePvEntryS } from "../../../services/pv_entry/pv_entry.service.js";

export const getBobbinForPvC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await getBobbinForPvS(bobbin_no);

        if (!result.found) {
            return res.status(404).json({ success: false, message: result.message });
        }

        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.status(200).json({
            success: true,
            data: result.data,
            has_pv_record: result.has_pv_record,
            d2_status: result.d2_status,
            h2_status: result.h2_status
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBobbinColorC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const { fiber_color } = req.body;

        const result = await updateBobbinColorS(bobbin_no, fiber_color);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const pvEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await pvEntryS({ ...req.body, logged_in_user: emp_id });

        res.status(201).json(result);
    } catch (error) {
        console.error("PV Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBobbinForRePvC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await getBobbinForRePvS(bobbin_no);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rePvEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await rePvEntryS({ ...req.body, logged_in_user: emp_id });

        res.status(200).json(result);
    } catch (error) {
        console.error("Re-PV Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
