import { fetchBobbinQcS, checkProcessCompletionS, submitQcEntryS, updateMissingValuesS, ptCheckByBobbinS } from "../../../services/qc_entry/qc_entry.service.js";
import { validateBobbinQC } from "../../../services/qc_entry/qc_grade.service.js";
import { mbendCopyS } from "../../../services/qc_entry/mbend_copy.service.js";
import { mbendReassignS } from "../../../services/qc_entry/mbend_reassign.service.js";

export const fetchBobbinQcC = async (req, res) => {
    
    try {
        const { bobbin_no } = req.params;
        const result = await fetchBobbinQcS(bobbin_no);
console.log("QC:", result)
        if (result.success == false) {
            return res.status(200).json({ success: false, message: result.message });
        }

        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const checkProcessCompletionC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await checkProcessCompletionS(bobbin_no);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const gradeBobbinC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await validateBobbinQC(bobbin_no);

        if (result.status === 'ERROR' || result.status === 'CRITICAL_ERROR') {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitQcEntryC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await submitQcEntryS({ ...req.body, logged_in_user: emp_id });

        res.status(201).json(result);
    } catch (error) {
        console.error("QC Entry Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMissingValuesC = async (req, res) => {
    try {
        const { bobbin_no, values } = req.body;
       
        if (!bobbin_no) {
            return res.status(400).json({ success: false, message: "bobbin_no is required" });
        }
        if (!values || typeof values !== 'object' || Object.keys(values).length === 0) {
            return res.status(400).json({ success: false, message: "No values provided" });
        }

        const result = await updateMissingValuesS(bobbin_no, values);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const mbendCopyC = async (req, res) => {
    try {
        const { bobbin_no } = req.body;

        if (!bobbin_no) {
            return res.status(400).json({ success: false, message: "bobbin_no required" });
        }

        const result = await mbendCopyS(bobbin_no);

        if (!result.success) {
            return res.status(200).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('[MBEnd] Error:', error);
        return res.status(500).json({ success: false, message: "MBEnd copy failed", error: error.message });
    }
};


//hi 

export const mbendReassignC = async (req, res) => {
    try {
        const { bobbin_no } = req.body;

        if (!bobbin_no) {
            return res.status(400).json({ success: false, message: "bobbin_no required" });
        }

        const result = await mbendReassignS(bobbin_no);
        return res.status(200).json(result);
    } catch (error) {
        console.error('[MBendReassign] Controller Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const ptCheckByBobbinC = async (req, res) => {
    try {
        const { bobbin_no } = req.params;
        const result = await ptCheckByBobbinS(bobbin_no);

        if (!result.found) {
            return res.status(200).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
