import express from 'express';
import {
    getDashboardC, getProductionSummaryC, getPreformReportC,
    getSpoolReportC, getFlawReportC, getBreakReportC,
    getTowerPerformanceC, getShiftPerformanceC, getOperatorPerformanceC,
    getDrawParametersC, getScrapAnalysisC, exportReportC, getPreformAcceptReportC, getHandleJoinReportC, getPreformAllocReportC, getDrawEntryReportC
} from '../../controller/postgres/draw_reports/draw_reports.controller.js';

const router = express.Router();

router.get('/draw-reports/dashboard', getDashboardC);
router.get('/draw-reports/production-summary', getProductionSummaryC);
router.get('/draw-reports/preform-report', getPreformReportC);
router.get('/draw-reports/spool-report', getSpoolReportC);
router.get('/draw-reports/flaw-report', getFlawReportC);
router.get('/draw-reports/break-report', getBreakReportC);
router.get('/draw-reports/tower-performance', getTowerPerformanceC);
router.get('/draw-reports/shift-performance', getShiftPerformanceC);
router.get('/draw-reports/operator-performance', getOperatorPerformanceC);
router.get('/draw-reports/draw-parameters', getDrawParametersC);
router.get('/draw-reports/scrap-analysis', getScrapAnalysisC);
router.get('/draw-reports/preform-accept', getPreformAcceptReportC);
router.get('/draw-reports/handle-join', getHandleJoinReportC);
router.get('/draw-reports/preform-allocation', getPreformAllocReportC);
router.get('/draw-reports/draw-entry', getDrawEntryReportC);
router.get('/draw-reports/export', exportReportC);

export default router;
