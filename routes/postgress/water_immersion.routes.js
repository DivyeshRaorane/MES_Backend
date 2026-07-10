import express from 'express';
import { getWiByBarcodeC, saveWiEntryC } from '../../controller/postgres/water_immersion/water_immersion.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/water-immersion/:bobbin_no', authMiddleware, getWiByBarcodeC);
router.post('/water-immersion', authMiddleware, saveWiEntryC);

export default router;
