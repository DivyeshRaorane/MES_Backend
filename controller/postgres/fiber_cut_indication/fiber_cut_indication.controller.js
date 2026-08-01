import {
    getAllFiberCutIndicationsS,
    getFiberCutIndicationByIdS,
    createFiberCutIndicationS,
    updateFiberCutIndicationS,
    deleteFiberCutIndicationS
} from "../../../services/fiber_cut_indication/fiber_cut_indication.service.js";

// GET /api/fiber-cut-indication
export const getAllFiberCutIndicationsC = async (req, res) => {
    try {
        const data = await getAllFiberCutIndicationsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

// GET /api/fiber-cut-indication/:id
export const getFiberCutIndicationByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await getFiberCutIndicationByIdS(id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Indication not found" });
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
    }
};

// POST /api/fiber-cut-indication
export const createFiberCutIndicationC = async (req, res) => {
    try {
        const result = await createFiberCutIndicationS(req.body);
        if (result?.duplicate) {
            return res.status(400).json({ success: false, message: result.message });
        }
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/fiber-cut-indication/:id
export const updateFiberCutIndicationC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateFiberCutIndicationS(id, req.body);
        if (result?.duplicate) {
            return res.status(400).json({ success: false, message: result.message });
        }
        if (!result) {
            return res.status(404).json({ success: false, message: "Indication not found" });
        }
        res.status(200).json({ success: true, message: "Updated successfully", data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/fiber-cut-indication/:id (Soft delete)
export const deleteFiberCutIndicationC = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteFiberCutIndicationS(id);
        if (!result) {
            return res.status(404).json({ success: false, message: "Indication not found" });
        }
        res.status(200).json({ success: true, message: "Deleted successfully", data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
