import express from 'express';
import { createDrawFiberCutReasonC, getAllDrawFiberCutReasonsC } from '../../controller/postgres/draw_fiber_cut_reason/draw_fiber_cut_reason.controller.js';

const router = express.Router();

router.post("/createdrawfibercutreason", createDrawFiberCutReasonC);
router.get("/getalldrawfibercutreasons", getAllDrawFiberCutReasonsC);

export default router;