import express from 'express';
import { getWiEntryListC, getWiEntryByIdC, createWiEntryC, updateWiEntryC } from '../../controller/postgres/water_immersion/water_immersion.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Primary routes
router.get('/wi-entry', authMiddleware, getWiEntryListC);
router.get('/wi-entry/:id', authMiddleware, getWiEntryByIdC);
router.post('/wi-entry', authMiddleware, createWiEntryC);
router.put('/wi-entry/:id', authMiddleware, updateWiEntryC);

// Alias routes (backward compatibility)
router.get('/water-immersion', authMiddleware, getWiEntryListC);
router.get('/water-immersion/:id', authMiddleware, getWiEntryByIdC);
router.post('/water-immersion', authMiddleware, createWiEntryC);
router.put('/water-immersion/:id', authMiddleware, updateWiEntryC);

export default router;
