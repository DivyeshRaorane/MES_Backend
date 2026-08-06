import { scanForColouringS, saveColouringS, getJobCardsS, getJobCardBobbinsS } from "../../../services/colouring/colouring.service.js";

export const scanColouringC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await scanForColouringS(bobbin_no);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveColouringC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await saveColouringS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("Colouring Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getJobCardsC = async (req, res) => {
    try {
        const result = await getJobCardsS();
        res.status(200).json(result);
    } catch (error) {
        console.error("Job Cards Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getJobCardBobbinsC = async (req, res) => {
    try {
        const col_jcard_no = decodeURIComponent(req.params.col_jcard_no);
        const result = await getJobCardBobbinsS(col_jcard_no);
        res.status(200).json(result);
    } catch (error) {
        console.error("Job Card Bobbins Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
