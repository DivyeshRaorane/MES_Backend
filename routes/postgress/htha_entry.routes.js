import express from 'express';
import { getHthaEntryListC, getHthaEntryByIdC, createHthaEntryC, updateHthaEntryC } from '../../controller/postgres/htha_entry/htha_entry.controller.js';

const router = express.Router();

router.get('/htha-entry', getHthaEntryListC);
router.get('/htha-entry/:id', getHthaEntryByIdC);
router.post('/htha-entry', createHthaEntryC);
router.put('/htha-entry/:id', updateHthaEntryC);

export default router;
