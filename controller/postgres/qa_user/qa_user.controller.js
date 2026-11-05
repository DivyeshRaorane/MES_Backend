import { getAllQaUsersS } from "../../../services/qa_user/qa_user.service.js";

// GET /api/getqausers?is_active=true|false (optional)
export const getAllQaUsersC = async (req, res) => {
    try {
        const { is_active } = req.query;

        let flag = null;
        if (is_active !== undefined) {
            flag = is_active === "true" ? true : is_active === "false" ? false : undefined;
            if (flag === undefined) {
                return res.status(400).json({ success: false, message: "is_active must be true or false", data: null });
            }
        }

        const result = await getAllQaUsersS(flag);
        res.status(200).json({ success: true, message: "QA users fetched successfully", data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};
