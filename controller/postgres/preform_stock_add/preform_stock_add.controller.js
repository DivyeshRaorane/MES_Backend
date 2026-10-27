import { addPreformStockS } from "../../../services/preform_stock_add/preform_stock_add.service.js";

export const addPreformStockController = async (req, res) => {
    try {
        const { preform_id, adding_weight } = req.body;

        const emp_id = req.user?.emp_id;

        const result = await addPreformStockS({
            preform_id,
            adding_weight,
            logged_in_user: emp_id,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("Add Preform Stock Error:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: "Failed to add preform stock",
            error: error.message,
        });
    }
};
