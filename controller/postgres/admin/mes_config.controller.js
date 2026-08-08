import { getAllConfigsS, createConfigS, updateConfigS, toggleConfigStatusS } from "../../../services/admin/mes_config.service.js";

// GET /api/admin/mes-config
export const getAllConfigsC = async (req, res) => {
    try {
        const result = await getAllConfigsS();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/admin/mes-config
export const createConfigC = async (req, res) => {
    try {
        const { config_key, config_value, description } = req.body;
        const updated_by = req.user?.emp_name || req.user?.emp_id || req.body.updated_by || null;

        const result = await createConfigS({ config_key, config_value, description, updated_by });
        res.status(201).json({ success: true, message: "Config created successfully", data: result });
    } catch (error) {
        if (error.message === "Config key already exists") {
            return res.status(409).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/admin/mes-config/:id
export const updateConfigC = async (req, res) => {
    try {
        const { id } = req.params;
        const { config_value, description } = req.body;
        const updated_by = req.user?.emp_name || req.user?.emp_id || req.body.updated_by || null;

        await updateConfigS(id, { config_value, description, updated_by });
        res.status(200).json({ success: true, message: "Config updated successfully" });
    } catch (error) {
        if (error.message === "Config entry not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/admin/mes-config/:id/status
export const toggleConfigStatusC = async (req, res) => {
    try {
        const { id } = req.params;
        const { disable } = req.body;
        const updated_by = req.user?.emp_name || req.user?.emp_id || req.body.updated_by || null;

        await toggleConfigStatusS(id, { disable, updated_by });
        const statusText = disable ? "disabled" : "enabled";
        res.status(200).json({ success: true, message: `Config ${statusText} successfully` });
    } catch (error) {
        if (error.message === "Config entry not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
