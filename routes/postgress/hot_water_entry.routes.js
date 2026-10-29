import express from 'express';
import { getHotWaterEntryListC, getHotWaterEntryByIdC, createHotWaterEntryC, updateHotWaterEntryC } from '../../controller/postgres/hot_water_entry/hot_water_entry.controller.js';

const router = express.Router();

router.get('/hot-water-entry', getHotWaterEntryListC);
router.get('/hot-water-entry/:id', getHotWaterEntryByIdC);
router.post('/hot-water-entry', createHotWaterEntryC);
router.put('/hot-water-entry/:id', updateHotWaterEntryC);

export default router;
