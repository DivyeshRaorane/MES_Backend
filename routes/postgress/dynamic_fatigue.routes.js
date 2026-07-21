import express from 'express';
import { getDynamicFatigueListC, getDynamicFatigueByIdC, createDynamicFatigueC, updateDynamicFatigueC } from '../../controller/postgres/dynamic_fatigue/dynamic_fatigue.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/dynamic-fatigue', authMiddleware, getDynamicFatigueListC);
router.get('/dynamic-fatigue/:id', authMiddleware, getDynamicFatigueByIdC);
router.post('/dynamic-fatigue', authMiddleware, createDynamicFatigueC);
router.put('/dynamic-fatigue/:id', authMiddleware, updateDynamicFatigueC);

export default router;
