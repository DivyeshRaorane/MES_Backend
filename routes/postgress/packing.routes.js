import express from 'express';
import { getOrderC, validateBobbinC, submitPackingC, getPackingListHistoryC, getPackingListViewC, deletePackingBobbinC, deletePackingBoxC, addBobbinToPackingC } from '../../controller/postgres/packing/packing.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/packing/list', authMiddleware, getPackingListHistoryC);
router.get('/packing/view/:order_no', authMiddleware, getPackingListViewC);
router.get('/packing/order/:order_no', getOrderC);
router.get('/packing/validate/:bobbin_no', validateBobbinC);
router.post('/packing/submit', authMiddleware, submitPackingC);
router.post('/packing/add-bobbin', authMiddleware, addBobbinToPackingC);
router.delete('/packing/bobbin/:packing_order_bobbin_id', authMiddleware, deletePackingBobbinC);
router.delete('/packing/box/:order_no/:stack_no/:box_no', authMiddleware, deletePackingBoxC);

export default router;
