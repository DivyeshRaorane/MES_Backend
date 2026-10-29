import express from 'express';
import { getFilteredFiberCutReasonsC } from '../../controller/postgres/fiber_cut_reasons/fiber_cut_reasons.controller.js';

const router = express.Router();

// Fiber Cut Reasons - filtered by indication_id (optional query param)
router.get('/fiber-cut-reasons', getFilteredFiberCutReasonsC);

export default router;
