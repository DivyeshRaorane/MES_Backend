import {
    getAllSectionsS,
    getReportSectionsS,
    updateReportSectionsS
} from "../../../services/report_builder/report_sections.service.js";

// ═══════════════════════════════════════════════════════════════
// REPORT SECTIONS CONTROLLER
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/report-builder/sections
 * Get all active sections for multi-select dropdown
 */
export const getAllSectionsC = async (req, res) => {
    try {
        const data = await getAllSectionsS();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/report-builder/reports/:reportId/sections
 * Get sections assigned to a specific report
 */
export const getReportSectionsC = async (req, res) => {
    try {
        const data = await getReportSectionsS(req.params.reportId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * PUT /api/report-builder/reports/:reportId/sections
 * Update section mappings for a report
 */
export const updateReportSectionsC = async (req, res) => {
    try {
        const { section_ids } = req.body;
        const reportId = req.params.reportId;

        if (!Array.isArray(section_ids) || section_ids.length === 0) {
            return res.status(400).json({ message: 'At least one section must be selected' });
        }

        const sections = await updateReportSectionsS(reportId, section_ids);
        res.status(200).json({
            message: 'Sections updated successfully',
            sections
        });
    } catch (error) {
        if (error.message === 'Report not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'One or more invalid section IDs') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'At least one section must be selected') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};
