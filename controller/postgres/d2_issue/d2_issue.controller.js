import { validateBobbinForD2S, submitD2IssueS } from "../../../services/d2_issue/d2_issue.service.js";

export const validateBobbinForD2C = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const restricted = req.query.restricted === 'true';

        const result = await validateBobbinForD2S(bobbin_no, restricted);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitD2IssueC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await submitD2IssueS({ ...req.body, logged_in_user: emp_id });

        res.status(201).json(result);
    } catch (error) {
        console.error("D2 Issue Error:", error.message);
        const isValidation = error.message.startsWith("Mandatory selection for H2")
            || error.message.startsWith("H2 bobbin(s) not part");
        res.status(isValidation ? 400 : 500).json({ success: false, message: error.message });
    }
};
