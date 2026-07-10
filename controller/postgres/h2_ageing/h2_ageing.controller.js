import {
    getChambersInUseS, getBatchesForIssueS, validateBobbinForH2S,
    issueH2S, getPendingBeforeS, getPendingAfterS, getPending14DayS,
    getBobbinsForBatchS, saveBeforeEntryS, saveAfterEntryS, save14DayEntryS
} from "../../../services/h2_ageing/h2_ageing.service.js";

export const getChambersInUseC = async (req, res) => {
    try {
        const result = await getChambersInUseS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBatchesForIssueC = async (req, res) => {
    try {
        const result = await getBatchesForIssueS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const validateBobbinC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const { d2_batch_id } = req.query;

        // Parse comma-separated batch IDs
        const d2_batch_ids = d2_batch_id ? d2_batch_id.split(',').map(s => s.trim()) : [];

        const result = await validateBobbinForH2S(bobbin_no, d2_batch_ids);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const issueH2C = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await issueH2S({ ...req.body, logged_in_user: emp_id });
        res.status(201).json(result);
    } catch (error) {
        console.error("H2 Issue Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPendingBeforeC = async (req, res) => {
    try {
        const result = await getPendingBeforeS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPendingAfterC = async (req, res) => {
    try {
        const result = await getPendingAfterS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPending14DayC = async (req, res) => {
    try {
        const result = await getPending14DayS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBobbinsForBatchC = async (req, res) => {
    try {
        const { h2_batch_id } = req.params;
        const result = await getBobbinsForBatchS(h2_batch_id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveBeforeEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await saveBeforeEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const saveAfterEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await saveAfterEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const save14DayEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await save14DayEntryS({ ...req.body, logged_in_user: emp_id });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
