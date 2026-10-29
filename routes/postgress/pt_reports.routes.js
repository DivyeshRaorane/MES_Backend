import express from 'express';
import { getPtAllocationReportC, getPtEntryReportC, getPtFlawsReportC, getFiberEntryReportC, getColoringReportC, getRewindingReportC, exportPtReportC } from '../../controller/postgres/pt_reports/pt_reports.controller.js';

const router = express.Router();

router.get('/pt-reports/allocation', getPtAllocationReportC);
router.get('/pt-reports/entry', getPtEntryReportC);
router.get('/pt-reports/flaws', getPtFlawsReportC);
router.get('/pt-reports/fiber-entry', getFiberEntryReportC);
router.get('/pt-reports/coloring', getColoringReportC);
router.get('/pt-reports/rewinding', getRewindingReportC);
router.get('/pt-reports/export', exportPtReportC);

export default router;
