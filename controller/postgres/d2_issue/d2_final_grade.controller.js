import { d2FinalGradeSingleS, d2FinalGradeBulkS } from "../../../services/d2_issue/d2_final_grade.service.js";

export const d2FinalGradeSingleC = async (req, res) => {
    try {
        const { bobbin_no } = req.body;

        if (!bobbin_no) {
            return res.status(400).json({
                success: false,
                message: "bobbin_no is required"
            });
        }

        const data = await d2FinalGradeSingleS(bobbin_no);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("D2 Final Grade Single Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const d2FinalGradeBulkC = async (req, res) => {
    try {
        const { bobbins } = req.body;

        if (!bobbins || !Array.isArray(bobbins) || bobbins.length === 0) {
            return res.status(400).json({
                success: false,
                message: "bobbins array is required and must not be empty"
            });
        }

        const data = await d2FinalGradeBulkS(bobbins);

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("D2 Final Grade Bulk Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
