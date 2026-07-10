import express from 'express';
import { getCycleByBarcodeC, saveCycleEntryC } from '../../controller/postgres/temp_cycle_entry/temp_cycle_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/temp-cycle-entry/:bobbin_no', authMiddleware, getCycleByBarcodeC);
router.post('/temp-cycle-entry', authMiddleware, saveCycleEntryC);

export default router;
