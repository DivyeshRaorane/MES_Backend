import express from 'express';
import { getHthaEntryListC, getHthaEntryByIdC, createHthaEntryC, updateHthaEntryC } from '../../controller/postgres/htha_entry/htha_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/htha-entry', authMiddleware, getHthaEntryListC);
router.get('/htha-entry/:id', authMiddleware, getHthaEntryByIdC);
router.post('/htha-entry', authMiddleware, createHthaEntryC);
router.put('/htha-entry/:id', authMiddleware, updateHthaEntryC);

export default router;
