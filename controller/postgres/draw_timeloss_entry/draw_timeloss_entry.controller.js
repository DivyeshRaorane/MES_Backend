import { createDrawTimelossEntryS } from "../../../services/draw_timeloss_entry/draw_timeloss_entry.service.js";

const VALID_FLOOR_TYPES = ["furnace", "ground"];

const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
};

export const createDrawTimelossEntryC = async (req, res) => {
    try {
        const { floor_type, date, shift, operator, shift_incharge, rows } = req.body;

        // --- Validation ---
        if (!VALID_FLOOR_TYPES.includes(floor_type)) {
            return res.status(400).json({
                success: false,
                message: "floor_type must be one of: furnace, ground.",
            });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: "date must be a valid date in YYYY-MM-DD format.",
            });
        }

        if (typeof shift !== "string" || shift.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "shift is required and must be non-empty.",
            });
        }

        if (!Array.isArray(rows) || rows.length !== 4) {
            return res.status(400).json({
                success: false,
                message: "rows must contain exactly 4 entries (one per draw tower).",
            });
        }

        // logged_in_user comes only from the authenticated context, never the client body.
        const logged_in_user = req.user?.emp_id ?? req.user?.userId;
        if (!logged_in_user) {
            return res.status(401).json({
                success: false,
                message: "Unable to resolve authenticated user.",
            });
        }

        const result = await createDrawTimelossEntryS({
            floor_type,
            date,
            shift: shift.trim(),
            operator,
            shift_incharge,
            rows,
            logged_in_user: String(logged_in_user),
        });

        return res.status(201).json(result);
    } catch (error) {
        console.error("Draw Timeloss Entry Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};
