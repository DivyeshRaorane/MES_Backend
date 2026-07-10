import express from 'express';
import { createDrawShiftPlanC } from '../../controller/postgres/draw_shift_plan/draw_shift_plan.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post('/drawshiftplan', authMiddleware, createDrawShiftPlanC);

export default router;
