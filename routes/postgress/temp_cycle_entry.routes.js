import express from 'express';
import { getCycleByBarcodeC, saveCycleEntryC } from '../../controller/postgres/temp_cycle_entry/temp_cycle_entry.controller.js';

const router = express.Router();

router.get('/temp-cycle-entry/:bobbin_no', getCycleByBarcodeC);
router.post('/temp-cycle-entry', saveCycleEntryC);

export default router;
