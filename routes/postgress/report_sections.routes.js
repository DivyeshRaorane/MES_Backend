import express from 'express';
import { authMiddleware } from '../../middleware/aut_middleware.js';
import {
    getAllSectionsC,
    getReportSectionsC,
    updateReportSectionsC
} from '../../controller/postgres/report_builder/report_sections.controller.js';

const router = express.Router();

// GET all active sections (for admin UI multi-select dropdown)
router.get('/sections', authMiddleware, getAllSectionsC);

// GET sections mapped to a specific report
router.get('/reports/:reportId/sections', authMiddleware, getReportSectionsC);

// UPDATE section mappings for a report
router.put('/reports/:reportId/sections', authMiddleware, updateReportSectionsC);

export default router;
