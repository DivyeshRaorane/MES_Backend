import express from 'express';
import { getChambersInUseC, getRunningBatchC, submitGasEntryC } from '../../controller/postgres/d2_gas/d2_gas.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/d2gas/chambers-in-use', getChambersInUseC);
router.get('/d2gas/running-batch/:chamber_no', getRunningBatchC);
router.post('/d2gas/entry', authMiddleware, submitGasEntryC);

export default router;
