import express from 'express';
import {
    getPackingOrdersC, loadPackingOrderC, saveTcC, listTcC, getTcByIdC
} from '../../controller/postgres/tc_generation/tc_generation.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/packing-orders', authMiddleware, getPackingOrdersC);
router.get('/load/:orderNo', authMiddleware, loadPackingOrderC);
router.post('/save', authMiddleware, saveTcC);
router.get('/', authMiddleware, listTcC);
router.get('/:tcId', authMiddleware, getTcByIdC);

export default router;
