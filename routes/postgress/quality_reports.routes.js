import express from 'express';
import { getQualityEntryReportC, exportQualityReportC } from '../../controller/postgres/quality_reports/quality_reports.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/quality-reports/quality-entry', authMiddleware, getQualityEntryReportC);
router.get('/quality-reports/export', authMiddleware, exportQualityReportC);

export default router;
