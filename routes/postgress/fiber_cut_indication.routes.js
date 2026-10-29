import express from 'express';
import {
    getAllFiberCutIndicationsC,
    getFiberCutIndicationByIdC,
    createFiberCutIndicationC,
    updateFiberCutIndicationC,
    deleteFiberCutIndicationC
} from '../../controller/postgres/fiber_cut_indication/fiber_cut_indication.controller.js';

const router = express.Router();

// Fiber Cut Indication CRUD
router.get('/fiber-cut-indication', getAllFiberCutIndicationsC);
router.get('/fiber-cut-indication/:id', getFiberCutIndicationByIdC);
router.post('/fiber-cut-indication', createFiberCutIndicationC);
router.put('/fiber-cut-indication/:id', updateFiberCutIndicationC);
router.delete('/fiber-cut-indication/:id', deleteFiberCutIndicationC);

export default router;
