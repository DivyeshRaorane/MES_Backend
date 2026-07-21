import express from 'express';
import { getAatEntryListC, getAatEntryByIdC, createAatEntryC, updateAatEntryC } from '../../controller/postgres/accelerated_ageing/accelerated_ageing.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Primary routes
router.get('/aat-entry', authMiddleware, getAatEntryListC);
router.get('/aat-entry/:id', authMiddleware, getAatEntryByIdC);
router.post('/aat-entry', authMiddleware, createAatEntryC);
router.put('/aat-entry/:id', authMiddleware, updateAatEntryC);

// Alias routes (backward compatibility)
router.get('/accelerated-ageing', authMiddleware, getAatEntryListC);
router.get('/accelerated-ageing/:id', authMiddleware, getAatEntryByIdC);
router.post('/accelerated-ageing', authMiddleware, createAatEntryC);
router.put('/accelerated-ageing/:id', authMiddleware, updateAatEntryC);

export default router;
