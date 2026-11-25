import {
    insertDrawSpecialRemarkS,
    getDrawSpecialRemarkS,
    updateDrawSpecialRemarkDisableS,
    updateDrawSpecialRemarkTextS,
} from "../../../../services/draw_entry/draw_special_remark/draw_special_remark.service.js";

const toBool = (v) => (v === true || v === "true" ? true : v === false || v === "false" ? false : null);

export const insertDrawSpecialRemarkC = async (req, res) => {
    try {
        const { s_d_remark, is_disable } = req.body;
        if (!s_d_remark || !String(s_d_remark).trim()) {
            return res.status(400).json({ success: false, message: "s_d_remark is required" });
        }
        const flag = is_disable === undefined ? false : toBool(is_disable);
        if (flag === null) {
            return res.status(400).json({ success: false, message: "is_disable must be true or false" });
        }
        const data = await insertDrawSpecialRemarkS({ s_d_remark: String(s_d_remark).trim(), is_disable: flag });
        return res.status(200).json({ success: true, message: "Draw special remark created", data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const getDrawSpecialRemarkC = async (req, res) => {
    try {
        const flag = toBool(req.query.is_disable);
        if (flag === null) {
            return res.status(400).json({ success: false, message: "is_disable query must be true or false" });
        }
        const data = await getDrawSpecialRemarkS({ is_disable: flag });
        return res.status(200).json({ success: true, message: "Draw special remarks fetched", data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const updateDrawSpecialRemarkTextC = async (req, res) => {
    try {
        const { id } = req.params;
        const { s_d_remark } = req.body;
        if (!s_d_remark || !String(s_d_remark).trim()) {
            return res.status(400).json({ success: false, message: "s_d_remark is required" });
        }
        const data = await updateDrawSpecialRemarkTextS({ id, s_d_remark: String(s_d_remark).trim() });
        if (!data) {
            return res.status(404).json({ success: false, message: "Draw special remark not found" });
        }
        return res.status(200).json({ success: true, message: "Draw special remark edited", data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

export const updateDrawSpecialRemarkDisableC = async (req, res) => {
    try {
        const { id } = req.params;
        const flag = toBool(req.body.is_disable);
        if (flag === null) {
            return res.status(400).json({ success: false, message: "is_disable must be true or false" });
        }
        const data = await updateDrawSpecialRemarkDisableS({ id, is_disable: flag });
        if (!data) {
            return res.status(404).json({ success: false, message: "Draw special remark not found" });
        }
        return res.status(200).json({ success: true, message: "Draw special remark updated", data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};
