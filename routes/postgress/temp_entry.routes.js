import express from 'express';
import { getTempEntryListC, getTempEntryByIdC, createTempEntryC, updateTempEntryC } from '../../controller/postgres/temp_entry/temp_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/temp-entry', authMiddleware, getTempEntryListC);
router.get('/temp-entry/:id', authMiddleware, getTempEntryByIdC);
router.post('/temp-entry', authMiddleware, createTempEntryC);
router.put('/temp-entry/:id', authMiddleware, updateTempEntryC);

export default router;
