import express from 'express';
import { getWiEntryListC, getWiEntryByIdC, createWiEntryC, updateWiEntryC } from '../../controller/postgres/water_immersion/water_immersion.controller.js';

const router = express.Router();

// Primary routes
router.get('/wi-entry', getWiEntryListC);
router.get('/wi-entry/:id', getWiEntryByIdC);
router.post('/wi-entry', createWiEntryC);
router.put('/wi-entry/:id', updateWiEntryC);

// Alias routes (backward compatibility)
router.get('/water-immersion', getWiEntryListC);
router.get('/water-immersion/:id', getWiEntryByIdC);
router.post('/water-immersion', createWiEntryC);
router.put('/water-immersion/:id', updateWiEntryC);

export default router;
