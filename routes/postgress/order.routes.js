import express from 'express';
import { getAllOrdersC, createOrderC, updateOrderC } from '../../controller/postgres/order/order.controller.js';

const router = express.Router();

router.get('/orders', getAllOrdersC);
router.post('/orders', createOrderC);
router.put('/orders/:packing_order_id', updateOrderC);

export default router;
