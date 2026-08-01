import express from 'express';
import {
    getAllFiberCutIndicationsC,
    getFiberCutIndicationByIdC,
    createFiberCutIndicationC,
    updateFiberCutIndicationC,
    deleteFiberCutIndicationC
} from '../../controller/postgres/fiber_cut_indication/fiber_cut_indication.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Fiber Cut Indication CRUD
router.get('/fiber-cut-indication', authMiddleware, getAllFiberCutIndicationsC);
router.get('/fiber-cut-indication/:id', authMiddleware, getFiberCutIndicationByIdC);
router.post('/fiber-cut-indication', authMiddleware, createFiberCutIndicationC);
router.put('/fiber-cut-indication/:id', authMiddleware, updateFiberCutIndicationC);
router.delete('/fiber-cut-indication/:id', authMiddleware, deleteFiberCutIndicationC);

export default router;
