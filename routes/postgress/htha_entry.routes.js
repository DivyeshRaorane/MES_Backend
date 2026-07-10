import express from 'express';
import { getHthaByBarcodeC, saveHthaEntryC } from '../../controller/postgres/htha_entry/htha_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/htha-entry/:bobbin_no', authMiddleware, getHthaByBarcodeC);
router.post('/htha-entry', authMiddleware, saveHthaEntryC);

export default router;
