import express from 'express';
import { getOrderC, validateBobbinC, submitPackingC, getPackingListHistoryC, getPackingListViewC } from '../../controller/postgres/packing/packing.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/packing/list', authMiddleware, getPackingListHistoryC);
router.get('/packing/view/:order_no', authMiddleware, getPackingListViewC);
router.get('/packing/order/:order_no', getOrderC);
router.get('/packing/validate/:bobbin_no', validateBobbinC);
router.post('/packing/submit', authMiddleware, submitPackingC);

export default router;
