import express from 'express';
import { getBobbinByBarcodeC, checkExistingTempEntryC, saveTempEntryC, updateTempEntryC } from '../../controller/postgres/temp_entry/temp_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/temp-entry/bobbin/:bobbin_no', authMiddleware, getBobbinByBarcodeC);
router.get('/temp-entry/check/:bobbin_no', authMiddleware, checkExistingTempEntryC);
router.post('/temp-entry', authMiddleware, saveTempEntryC);
router.put('/temp-entry/:id', authMiddleware, updateTempEntryC);

export default router;
