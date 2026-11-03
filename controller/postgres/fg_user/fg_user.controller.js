import { getAllFgUsersS } from "../../../services/fg_user/fg_user.service.js";

// GET /api/getfgusers?is_active=true|false (optional)
export const getAllFgUsersC = async (req, res) => {
    try {
        const { is_active } = req.query;

        let flag = null;
        if (is_active !== undefined) {
            flag = is_active === "true" ? true : is_active === "false" ? false : undefined;
            if (flag === undefined) {
                return res.status(400).json({ success: false, message: "is_active must be true or false", data: null });
            }
        }

        const result = await getAllFgUsersS(flag);
        res.status(200).json({ success: true, message: "FG users fetched successfully", data: result });
    } catch (error) {
        console.error("getAllFgUsersC:", error);
        res.status(500).json({ success: false, message: "Failed to fetch FG users", data: null });
    }
};
