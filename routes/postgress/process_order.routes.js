import express from 'express';
import {
    getAllProcessOrdersC, getProcessOrderByNoC, createProcessOrderC,
    updateProcessOrderC, toggleProcessOrderStatusC, getProcessOrderMaterialsC
} from '../../controller/postgres/process_order/process_order.controller.js';

const router = express.Router();

router.get('/', getAllProcessOrdersC);
router.get('/:processONo', getProcessOrderByNoC);
router.get('/:processONo/materials', getProcessOrderMaterialsC);
router.post('/', createProcessOrderC);
router.put('/:processONo', updateProcessOrderC);
router.patch('/:processONo/status', toggleProcessOrderStatusC);

export default router;
