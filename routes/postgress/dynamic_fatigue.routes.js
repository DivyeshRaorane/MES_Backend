import express from 'express';
import { getDynamicFatigueListC, getDynamicFatigueByIdC, createDynamicFatigueC, updateDynamicFatigueC } from '../../controller/postgres/dynamic_fatigue/dynamic_fatigue.controller.js';

const router = express.Router();

router.get('/dynamic-fatigue', getDynamicFatigueListC);
router.get('/dynamic-fatigue/:id', getDynamicFatigueByIdC);
router.post('/dynamic-fatigue', createDynamicFatigueC);
router.put('/dynamic-fatigue/:id', updateDynamicFatigueC);

export default router;
