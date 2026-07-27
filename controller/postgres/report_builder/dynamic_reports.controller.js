import {
    getUserReportsS, executeUserReportS, executeReportForExportS,
    getSavedFiltersS, createSavedFilterS, deleteSavedFilterS
} from "../../../services/report_builder/dynamic_reports.service.js";
import { generateExcelBuffer, generateCsvString, generatePdfBuffer } from "../../../services/report_builder/export.service.js";

// ═══════════════════════════════════════════════════════════════
// USER-FACING REPORTS
// ═══════════════════════════════════════════════════════════════

export const getUserReportsC = async (req, res) => {
    try {
        const data = await getUserReportsS(req.user);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const executeUserReportC = async (req, res) => {
    try {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const data = await executeUserReportS(req.params.id, req.body, req.user, ipAddress);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        if (error.message === 'Access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message === 'Report not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const exportExcelC = async (req, res) => {
    try {
        const result = await executeReportForExportS(req.params.id, req.body, req.user);
        const buffer = await generateExcelBuffer(result.data, result.columnOrder, result.columnDisplayNames, result.reportName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${result.reportName}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        if (error.message === 'Export access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportCsvC = async (req, res) => {
    try {
        const result = await executeReportForExportS(req.params.id, req.body, req.user);
        const csv = generateCsvString(result.data, result.columnOrder, result.columnDisplayNames);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.reportName}.csv"`);
        res.send(csv);
    } catch (error) {
        if (error.message === 'Export access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportPdfC = async (req, res) => {
    try {
        const result = await executeReportForExportS(req.params.id, req.body, req.user);
        const buffer = await generatePdfBuffer(result.data, result.columnOrder, result.columnDisplayNames, result.reportName);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.reportName}.pdf"`);
        res.send(buffer);
    } catch (error) {
        if (error.message === 'Export access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// SAVED FILTERS
// ═══════════════════════════════════════════════════════════════

export const getSavedFiltersC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const data = await getSavedFiltersS(req.params.id, userId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSavedFilterC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const data = await createSavedFilterS(req.params.id, userId, req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSavedFilterC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const result = await deleteSavedFilterS(req.params.filterId, userId);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Saved filter not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
