import express from 'express';
import { createDrawShiftReportC } from '../../controller/postgres/draw_shift_report/draw_shift_report.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post('/drawshiftreport', authMiddleware, createDrawShiftReportC);

export default router;
