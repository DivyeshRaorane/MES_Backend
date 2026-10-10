import {
    createDraftS,
    getDraftListS,
    getDraftDetailsS,
    saveDraftBobbinS,
    removeDraftBobbinS,
    deleteDraftS
} from "../../../services/d2_issue/d2_issue_draft.service.js";

// POST /d2issue/drafts/create — reserve the next draft id for a chamber.
// Called once when the operator selects a chamber.
export const createDraftC = async (req, res) => {
    console.log("Res", req)
    try {
        const { chamber, d2_type } = req.body;
        const created_by = req.user?.emp_id ?? null;

        const result = await createDraftS({ chamber, d2_type, created_by });

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json({ success: true, d2_batch_id: result.d2_batch_id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};

export const getDraftListC = async (req, res) => {
    try {
        const data = await getDraftListS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};

export const getDraftDetailsC = async (req, res) => {
    try {
        const { d2_batch_id } = req.params;
        const data = await getDraftDetailsS(d2_batch_id);

        if (!data) {
            return res.status(404).json({ success: false, message: 'Draft not found' });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};

export const saveDraftBobbinC = async (req, res) => {
    try {
        const { d2_batch_id, bobbin_fid, bobbin_no, chamber, d2_type } = req.body;
        const created_by = req.user?.emp_id ?? null;

        if (!d2_batch_id || !bobbin_no) {
            return res.status(400).json({ success: false, message: 'd2_batch_id and bobbin_no are required' });
        }

        const result = await saveDraftBobbinS({ d2_batch_id, bobbin_fid, bobbin_no, chamber, d2_type, created_by });

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};

export const removeDraftBobbinC = async (req, res) => {
    try {
        const { d2_batch_id, bobbin_no } = req.params;
        const result = await removeDraftBobbinS(d2_batch_id, bobbin_no);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};

export const deleteDraftC = async (req, res) => {
    try {
        const { d2_batch_id } = req.params;
        const result = await deleteDraftS(d2_batch_id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};
