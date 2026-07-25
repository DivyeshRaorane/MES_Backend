import { getGradeMandatoryS, upsertGradeMandatoryS } from "../../../services/grade_mandatory/grade_mandatory.service.js";

export const getGradeMandatoryC = async (req, res) => {
    try {
        const { grade, product_type } = req.query;

        if (!grade || !product_type) {
            return res.status(400).json({ success: false, message: "grade and product_type are required" });
        }

        const data = await getGradeMandatoryS(grade, product_type);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const upsertGradeMandatoryC = async (req, res) => {
    try {
        const { grade, product_type, mandatory_params } = req.body;

        if (!grade || !product_type) {
            return res.status(400).json({ success: false, message: "grade and product_type are required" });
        }

        await upsertGradeMandatoryS({ grade, product_type, mandatory_params });
        res.status(200).json({ success: true, message: "Mandatory params saved" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
