import express from 'express';
import { getChambersInUseC, getRunningBatchC, completeReceivingC } from '../../controller/postgres/d2_receiving/d2_receiving.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/d2receiving/chambers-in-use', getChambersInUseC);
router.get('/d2receiving/running-batch/:chamber_no', getRunningBatchC);
router.put('/d2receiving/complete', authMiddleware, completeReceivingC);

export default router;
