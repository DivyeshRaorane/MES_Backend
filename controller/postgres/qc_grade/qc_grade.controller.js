import { validateBobbinQC } from "../../../services/qc_entry/qc_grade.service.js";
import pool from "../../../db/postgres.js";

export const validateBobbinGradeC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await validateBobbinQC(bobbin_no);

        if (result.status === 'ERROR' || result.status === 'CRITICAL_ERROR') {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("QC Grade Validation Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGradeListC = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT qc_entry_id, grade, product_type FROM qc_grade WHERE status = true ORDER BY priority ASC`
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGradeByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`SELECT * FROM qc_grade WHERE qc_entry_id = $1`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Grade not found." });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
