import { createDrawShiftReportS } from "../../../services/draw_shift_report/draw_shift_report.service.js";

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
};

export const createDrawShiftReportC = async (req, res) => {
    try {
        const { date, shft, gr_f_opr, die, furnace_opr, sic, maint, towers } = req.body;

        // --- Validation ---
        if (!isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: "date must be a valid date in YYYY-MM-DD format.",
            });
        }

        if (typeof shft !== "string" || shft.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "shft is required and must be non-empty.",
            });
        }

        if (!Array.isArray(towers) || towers.length !== 4) {
            return res.status(400).json({
                success: false,
                message: "towers must contain exactly 4 entries (one per draw tower).",
            });
        }

        const dtValues = towers.map((t) => Number(t?.dt)).sort((a, b) => a - b);
        const dtValid = [1, 2, 3, 4].every((v, i) => dtValues[i] === v);
        if (!dtValid) {
            return res.status(400).json({
                success: false,
                message: "towers must have dt values 1, 2, 3 and 4.",
            });
        }

        for (const tower of towers) {
            if (!Array.isArray(tower.preforms) || tower.preforms.length < 1) {
                return res.status(400).json({
                    success: false,
                    message: `DT ${tower?.dt} must have at least 1 preform row.`,
                });
            }
        }

        // logged_in_user comes only from the authenticated context, never the body.
        const logged_in_user = req.user?.emp_id ?? req.user?.userId;
        if (!logged_in_user) {
            return res.status(401).json({
                success: false,
                message: "Unable to resolve authenticated user.",
            });
        }

        const result = await createDrawShiftReportS({
            date,
            shft: shft.trim(),
            gr_f_opr,
            die,
            furnace_opr,
            sic,
            maint,
            towers,
            logged_in_user: String(logged_in_user),
        });

        return res.status(201).json(result);
    } catch (error) {
        console.error("Draw Shift Report Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
