import express from 'express';
import {
    getPackingOrdersC, loadPackingOrderC, saveTcC, listTcC, getTcByIdC
} from '../../controller/postgres/tc_generation/tc_generation.controller.js';

const router = express.Router();

router.get('/packing-orders', getPackingOrdersC);
router.get('/load/:orderNo', loadPackingOrderC);
router.post('/save', saveTcC);
router.get('/', listTcC);
router.get('/:tcId', getTcByIdC);

export default router;
