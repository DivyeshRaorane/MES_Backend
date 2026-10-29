import express from 'express';
import { createDrawShiftReportC } from '../../controller/postgres/draw_shift_report/draw_shift_report.controller.js';

const router = express.Router();

router.post('/drawshiftreport', createDrawShiftReportC);

export default router;
