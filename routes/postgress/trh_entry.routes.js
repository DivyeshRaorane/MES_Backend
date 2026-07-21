import express from 'express';
import { getTrhEntryListC, getTrhEntryByIdC, createTrhEntryC, updateTrhEntryC } from '../../controller/postgres/trh_entry/trh_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/trh-entry', authMiddleware, getTrhEntryListC);
router.get('/trh-entry/:id', authMiddleware, getTrhEntryByIdC);
router.post('/trh-entry', authMiddleware, createTrhEntryC);
router.put('/trh-entry/:id', authMiddleware, updateTrhEntryC);

export default router;
