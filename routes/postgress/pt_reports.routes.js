import express from 'express';
import { getPtAllocationReportC, getPtEntryReportC, getPtFlawsReportC, getFiberEntryReportC, getColoringReportC, getRewindingReportC, exportPtReportC } from '../../controller/postgres/pt_reports/pt_reports.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/pt-reports/allocation', authMiddleware, getPtAllocationReportC);
router.get('/pt-reports/entry', authMiddleware, getPtEntryReportC);
router.get('/pt-reports/flaws', authMiddleware, getPtFlawsReportC);
router.get('/pt-reports/fiber-entry', authMiddleware, getFiberEntryReportC);
router.get('/pt-reports/coloring', authMiddleware, getColoringReportC);
router.get('/pt-reports/rewinding', authMiddleware, getRewindingReportC);
router.get('/pt-reports/export', authMiddleware, exportPtReportC);

export default router;
