import { getAllGradesS, createGradeS, updateGradeS } from "../../../services/admin/grade_admin.service.js";

export const getAllGradesC = async (req, res) => {
    try {
        const result = await getAllGradesS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createGradeC = async (req, res) => {
    try {
        const result = await createGradeS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateGradeC = async (req, res) => {
    try {
        const { qc_entry_id } = req.params;
        const result = await updateGradeS(qc_entry_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
