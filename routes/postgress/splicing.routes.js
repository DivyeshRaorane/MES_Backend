import express from 'express';
import { getSplicingListC, getSplicingByIdC, createSplicingC, updateSplicingC } from '../../controller/postgres/splicing/splicing.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/splicing', authMiddleware, getSplicingListC);
router.get('/splicing/:id', authMiddleware, getSplicingByIdC);
router.post('/splicing', authMiddleware, createSplicingC);
router.put('/splicing/:id', authMiddleware, updateSplicingC);

export default router;
