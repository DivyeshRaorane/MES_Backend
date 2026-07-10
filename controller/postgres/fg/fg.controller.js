import { validateColorS, submitColorS } from "../../../services/fg/fg_color.service.js";
import { validateRewindS, submitRewindS } from "../../../services/fg/fg_rewind.service.js";

export const validateColorC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const { require_color } = req.query;
        const result = await validateColorS(bobbin_no, require_color);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitColorC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await submitColorS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("FG Color Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const validateRewindC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await validateRewindS(bobbin_no);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitRewindC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await submitRewindS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("FG Rewind Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
