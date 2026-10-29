import express from 'express';
import { getTrhEntryListC, getTrhEntryByIdC, createTrhEntryC, updateTrhEntryC } from '../../controller/postgres/trh_entry/trh_entry.controller.js';

const router = express.Router();

router.get('/trh-entry', getTrhEntryListC);
router.get('/trh-entry/:id', getTrhEntryByIdC);
router.post('/trh-entry', createTrhEntryC);
router.put('/trh-entry/:id', updateTrhEntryC);

export default router;
