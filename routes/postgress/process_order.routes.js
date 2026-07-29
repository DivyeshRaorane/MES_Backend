import express from 'express';
import { authMiddleware } from '../../middleware/aut_middleware.js';
import {
    getAllProcessOrdersC, getProcessOrderByNoC, createProcessOrderC,
    updateProcessOrderC, toggleProcessOrderStatusC, getProcessOrderMaterialsC
} from '../../controller/postgres/process_order/process_order.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getAllProcessOrdersC);
router.get('/:processONo', authMiddleware, getProcessOrderByNoC);
router.get('/:processONo/materials', authMiddleware, getProcessOrderMaterialsC);
router.post('/', authMiddleware, createProcessOrderC);
router.put('/:processONo', authMiddleware, updateProcessOrderC);
router.patch('/:processONo/status', authMiddleware, toggleProcessOrderStatusC);

export default router;
