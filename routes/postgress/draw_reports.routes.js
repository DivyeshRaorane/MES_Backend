import express from 'express';
import {
    getDashboardC, getProductionSummaryC, getPreformReportC,
    getSpoolReportC, getFlawReportC, getBreakReportC,
    getTowerPerformanceC, getShiftPerformanceC, getOperatorPerformanceC,
    getDrawParametersC, getScrapAnalysisC, exportReportC, getPreformAcceptReportC, getHandleJoinReportC, getPreformAllocReportC, getDrawEntryReportC
} from '../../controller/postgres/draw_reports/draw_reports.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/draw-reports/dashboard', authMiddleware, getDashboardC);
router.get('/draw-reports/production-summary', authMiddleware, getProductionSummaryC);
router.get('/draw-reports/preform-report', authMiddleware, getPreformReportC);
router.get('/draw-reports/spool-report', authMiddleware, getSpoolReportC);
router.get('/draw-reports/flaw-report', authMiddleware, getFlawReportC);
router.get('/draw-reports/break-report', authMiddleware, getBreakReportC);
router.get('/draw-reports/tower-performance', authMiddleware, getTowerPerformanceC);
router.get('/draw-reports/shift-performance', authMiddleware, getShiftPerformanceC);
router.get('/draw-reports/operator-performance', authMiddleware, getOperatorPerformanceC);
router.get('/draw-reports/draw-parameters', authMiddleware, getDrawParametersC);
router.get('/draw-reports/scrap-analysis', authMiddleware, getScrapAnalysisC);
router.get('/draw-reports/preform-accept', authMiddleware, getPreformAcceptReportC);
router.get('/draw-reports/handle-join', authMiddleware, getHandleJoinReportC);
router.get('/draw-reports/preform-allocation', authMiddleware, getPreformAllocReportC);
router.get('/draw-reports/draw-entry', authMiddleware, getDrawEntryReportC);
router.get('/draw-reports/export', authMiddleware, exportReportC);

export default router;
