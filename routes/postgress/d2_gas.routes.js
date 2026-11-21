import express from 'express';
import { getD2GasChambersInUseC, getD2GasRunningBatchC, submitGasEntryC } from '../../controller/postgres/d2_gas/d2_gas.controller.js';

const router = express.Router();

router.get('/d2gas/chambers-in-use', getD2GasChambersInUseC);
router.get('/d2gas/running-batch/:chamber_no', getD2GasRunningBatchC);
router.post('/d2gas/entry', submitGasEntryC);

export default router;
