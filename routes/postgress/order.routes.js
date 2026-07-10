import express from 'express';
import { getAllOrdersC, createOrderC, updateOrderC } from '../../controller/postgres/order/order.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/orders', getAllOrdersC);
router.post('/orders', authMiddleware, createOrderC);
router.put('/orders/:packing_order_id', authMiddleware, updateOrderC);

export default router;
