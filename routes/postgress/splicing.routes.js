import express from 'express';
import { getSplicingListC, getSplicingByIdC, createSplicingC, updateSplicingC } from '../../controller/postgres/splicing/splicing.controller.js';

const router = express.Router();

router.get('/splicing', getSplicingListC);
router.get('/splicing/:id', getSplicingByIdC);
router.post('/splicing', createSplicingC);
router.put('/splicing/:id', updateSplicingC);

export default router;
