import {
    getTablesS, getTableColumnsS, getTableRelationshipsS,
    getAllReportsS, getReportByIdS, createReportS, updateReportS, deleteReportS, duplicateReportS,
    previewReportS, generateSqlS, executeReportS, previewTableS,
    getReportPermissionsS, updateReportPermissionsS, getRolesS, getUsersS
} from "../../../services/report_builder/report_builder.service.js";

// ═══════════════════════════════════════════════════════════════
// DATABASE DISCOVERY
// ═══════════════════════════════════════════════════════════════

export const getTablesC = async (req, res) => {
    try {
        const data = await getTablesS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTableColumnsC = async (req, res) => {
    try {
        const { tableName } = req.params;
        const data = await getTableColumnsS(tableName);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'Table not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTableRelationshipsC = async (req, res) => {
    try {
        const { tableName } = req.params;
        const data = await getTableRelationshipsS(tableName);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// REPORT CRUD
// ═══════════════════════════════════════════════════════════════

export const getAllReportsC = async (req, res) => {
    try {
        const data = await getAllReportsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getReportByIdC = async (req, res) => {
    try {
        const data = await getReportByIdS(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'Report not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createReportC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const data = await createReportS(req.body, userId);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateReportC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const data = await updateReportS(req.params.id, req.body, userId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'Report not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteReportC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const result = await deleteReportS(req.params.id, userId);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Report not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const duplicateReportC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const data = await duplicateReportS(req.params.id, userId);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// PREVIEW & EXECUTION
// ═══════════════════════════════════════════════════════════════

export const previewReportC = async (req, res) => {
    try {
        const data = await previewReportS(req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateSqlC = async (req, res) => {
    try {
        const data = await generateSqlS(req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const executeReportC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const data = await executeReportS(req.params.id, req.body, userId, ipAddress);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const getReportPermissionsC = async (req, res) => {
    try {
        const data = await getReportPermissionsS(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateReportPermissionsC = async (req, res) => {
    try {
        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ success: false, message: 'permissions array required' });
        }
        const result = await updateReportPermissionsS(req.params.id, permissions);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRolesC = async (req, res) => {
    try {
        const data = await getRolesS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUsersC = async (req, res) => {
    try {
        const data = await getUsersS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// PREVIEW TABLE (multi-sheet table configuration)
// ═══════════════════════════════════════════════════════════════

export const previewTableC = async (req, res) => {
    try {
        const data = await previewTableS(req.body);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
