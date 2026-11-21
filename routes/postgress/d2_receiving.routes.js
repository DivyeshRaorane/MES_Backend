import express from 'express';
import { getD2ReceivingChambersInUseC, getD2ReceivingRunningBatchC, completeReceivingC } from '../../controller/postgres/d2_receiving/d2_receiving.controller.js';

const router = express.Router();

router.get('/d2receiving/chambers-in-use', getD2ReceivingChambersInUseC);
router.get('/d2receiving/running-batch/:chamber_no', getD2ReceivingRunningBatchC);
router.put('/d2receiving/complete', completeReceivingC);

export default router;
