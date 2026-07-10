import express from 'express';
import { getTrhByBarcodeC, saveTrhEntryC } from '../../controller/postgres/trh_entry/trh_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/trh-entry/:bobbin_no', authMiddleware, getTrhByBarcodeC);
router.post('/trh-entry', authMiddleware, saveTrhEntryC);

export default router;
