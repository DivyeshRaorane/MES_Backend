import express from 'express';
import {
    getAllSectionsC,
    getReportSectionsC,
    updateReportSectionsC
} from '../../controller/postgres/report_builder/report_sections.controller.js';

const router = express.Router();

// GET all active sections (for admin UI multi-select dropdown)
router.get('/sections', getAllSectionsC);

// GET sections mapped to a specific report
router.get('/reports/:reportId/sections', getReportSectionsC);

// UPDATE section mappings for a report
router.put('/reports/:reportId/sections', updateReportSectionsC);

export default router;
