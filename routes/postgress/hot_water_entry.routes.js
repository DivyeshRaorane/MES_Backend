import express from 'express';
import { getHotWaterEntryListC, getHotWaterEntryByIdC, createHotWaterEntryC, updateHotWaterEntryC } from '../../controller/postgres/hot_water_entry/hot_water_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/hot-water-entry', authMiddleware, getHotWaterEntryListC);
router.get('/hot-water-entry/:id', authMiddleware, getHotWaterEntryByIdC);
router.post('/hot-water-entry', authMiddleware, createHotWaterEntryC);
router.put('/hot-water-entry/:id', authMiddleware, updateHotWaterEntryC);

export default router;
