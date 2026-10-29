import express from 'express';
import { createDrawShiftPlanC } from '../../controller/postgres/draw_shift_plan/draw_shift_plan.controller.js';

const router = express.Router();

router.post('/drawshiftplan', createDrawShiftPlanC);

export default router;
