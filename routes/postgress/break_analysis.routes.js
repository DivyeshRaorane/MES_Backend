import express from 'express';
import { getPendingBreaksC, getBobbinByFidC, saveBreakAnalysisC } from '../../controller/postgres/break_analysis/break_analysis.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/break-analysis/pending', authMiddleware, getPendingBreaksC);
router.get('/break-analysis/:fid', authMiddleware, getBobbinByFidC);
router.post('/break-analysis', authMiddleware, saveBreakAnalysisC);

export default router;
