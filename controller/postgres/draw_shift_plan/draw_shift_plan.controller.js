import { createDrawShiftPlanS } from "../../../services/draw_shift_plan/draw_shift_plan.service.js";

export const createDrawShiftPlanC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createDrawShiftPlanS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Draw Shift Plan Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
