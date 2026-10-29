import express from 'express';
import { getQualityEntryReportC, exportQualityReportC } from '../../controller/postgres/quality_reports/quality_reports.controller.js';

const router = express.Router();

router.get('/quality-reports/quality-entry', getQualityEntryReportC);
router.get('/quality-reports/export', exportQualityReportC);

export default router;
