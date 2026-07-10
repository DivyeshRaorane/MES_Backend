import { getAllComplaintsS, getComplaintByIdS, createComplaintS, updateComplaintS } from "../../../services/complaint/complaint.service.js";

export const getAllComplaintsC = async (req, res) => {
    try {
        const { status } = req.query;
        const result = await getAllComplaintsS(status || null);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getComplaintByIdC = async (req, res) => {
    try {
        const { complaint_id } = req.params;
        const result = await getComplaintByIdS(complaint_id);

        if (!result) {
            return res.status(404).json({ success: false, message: "Complaint not found." });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createComplaintC = async (req, res) => {
    try {
        const emp_id = req.user.emp_id;
        const result = await createComplaintS({ ...req.body, logged_in_user: emp_id });
        res.status(201).json({ success: true, message: "Complaint raised successfully.", data: result });
    } catch (error) {
        console.error("Create Complaint Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateComplaintC = async (req, res) => {
    try {
        const { complaint_id } = req.params;
        const result = await updateComplaintS(complaint_id, req.body);
        res.status(200).json({ success: true, message: "Complaint updated successfully.", data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
