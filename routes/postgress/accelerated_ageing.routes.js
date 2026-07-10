import express from 'express';
import { getAatByBarcodeC, saveAatEntryC } from '../../controller/postgres/accelerated_ageing/accelerated_ageing.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/accelerated-ageing/:bobbin_no', authMiddleware, getAatByBarcodeC);
router.post('/accelerated-ageing', authMiddleware, saveAatEntryC);

export default router;
