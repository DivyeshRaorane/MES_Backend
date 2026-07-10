import {
    createDrawUserAdminS, updateDrawUserAdminS,
    getAllDrawTowersS, createDrawTowerS, updateDrawTowerS,
    getAllFiberCutReasonsS, createFiberCutReasonS, updateFiberCutReasonS,
    getAllWindingObsS, createWindingObsS, updateWindingObsS
} from "../../../services/admin/draw_management.service.js";

// Draw Users
export const createDrawUserC = async (req, res) => {
    try {
        const result = await createDrawUserAdminS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDrawUserC = async (req, res) => {
    try {
        const { draw_user_id } = req.params;
        const result = await updateDrawUserAdminS(draw_user_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Draw Towers
export const getAllDrawTowersC = async (req, res) => {
    try {
        const result = await getAllDrawTowersS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDrawTowerC = async (req, res) => {
    try {
        const result = await createDrawTowerS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDrawTowerC = async (req, res) => {
    try {
        const { tower_id } = req.params;
        const result = await updateDrawTowerS(tower_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Fiber Cut Reasons
export const getAllFiberCutReasonsC = async (req, res) => {
    try {
        const result = await getAllFiberCutReasonsS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createFiberCutReasonC = async (req, res) => {
    try {
        const result = await createFiberCutReasonS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFiberCutReasonC = async (req, res) => {
    try {
        const { dfcr_id } = req.params;
        const result = await updateFiberCutReasonS(dfcr_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Winding Observations
export const getAllWindingObsC = async (req, res) => {
    try {
        const result = await getAllWindingObsS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createWindingObsC = async (req, res) => {
    try {
        const result = await createWindingObsS(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWindingObsC = async (req, res) => {
    try {
        const { wind_obs_id } = req.params;
        const result = await updateWindingObsS(wind_obs_id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
