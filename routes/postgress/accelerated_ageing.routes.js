import express from 'express';
import { getAatEntryListC, getAatEntryByIdC, createAatEntryC, updateAatEntryC } from '../../controller/postgres/accelerated_ageing/accelerated_ageing.controller.js';

const router = express.Router();

// Primary routes
router.get('/aat-entry', getAatEntryListC);
router.get('/aat-entry/:id', getAatEntryByIdC);
router.post('/aat-entry', createAatEntryC);
router.put('/aat-entry/:id', updateAatEntryC);

// Alias routes (backward compatibility)
router.get('/accelerated-ageing', getAatEntryListC);
router.get('/accelerated-ageing/:id', getAatEntryByIdC);
router.post('/accelerated-ageing', createAatEntryC);
router.put('/accelerated-ageing/:id', updateAatEntryC);

export default router;
