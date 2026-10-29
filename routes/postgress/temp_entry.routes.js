import express from 'express';
import { getTempEntryListC, getTempEntryByIdC, createTempEntryC, updateTempEntryC } from '../../controller/postgres/temp_entry/temp_entry.controller.js';

const router = express.Router();

router.get('/temp-entry', getTempEntryListC);
router.get('/temp-entry/:id', getTempEntryByIdC);
router.post('/temp-entry', createTempEntryC);
router.put('/temp-entry/:id', updateTempEntryC);

export default router;
