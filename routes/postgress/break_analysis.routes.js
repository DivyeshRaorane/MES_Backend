import express from 'express';
import { getPendingBreaksC, getBobbinByFidC, saveBreakAnalysisC } from '../../controller/postgres/break_analysis/break_analysis.controller.js';

const router = express.Router();

router.get('/break-analysis/pending', getPendingBreaksC);
router.get('/break-analysis/:fid', getBobbinByFidC);
router.post('/break-analysis', saveBreakAnalysisC);

export default router;
