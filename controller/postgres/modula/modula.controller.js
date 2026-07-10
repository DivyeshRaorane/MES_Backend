import { getTraysS, getPositionsS, assignBobbinS, removeBobbinS, searchBobbinS } from "../../../services/modula/modula.service.js";

export const getTraysC = async (req, res) => {
    try {
        const result = await getTraysS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPositionsC = async (req, res) => {
    try {
        const { tray_id } = req.params;
        const result = await getPositionsS(tray_id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const assignC = async (req, res) => {
    try {
        const { tray_id, position_no, bobbin_no } = req.body;
        const updated_by = req.user.emp_id;
        const result = await assignBobbinS(tray_id, position_no, bobbin_no, updated_by);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const removeC = async (req, res) => {
    try {
        const { tray_id, position_no } = req.body;
        const updated_by = req.user.emp_id;
        const result = await removeBobbinS(tray_id, position_no, updated_by);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const searchC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await searchBobbinS(bobbin_no);

        if (!result) {
            return res.status(404).json({ success: false, message: "Bobbin not found in any tray." });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
