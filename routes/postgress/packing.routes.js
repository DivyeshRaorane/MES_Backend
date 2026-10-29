import express from 'express';
import { getOrderC, validateBobbinC, submitPackingC, getPackingListHistoryC, getPackingListViewC, deletePackingBobbinC, deletePackingBoxC, addBobbinToPackingC } from '../../controller/postgres/packing/packing.controller.js';

const router = express.Router();

router.get('/packing/list', getPackingListHistoryC);
router.get('/packing/view/:order_no', getPackingListViewC);
router.get('/packing/order/:order_no', getOrderC);
router.get('/packing/validate/:bobbin_no', validateBobbinC);
router.post('/packing/submit', submitPackingC);
router.post('/packing/add-bobbin', addBobbinToPackingC);
router.delete('/packing/bobbin/:packing_order_bobbin_id', deletePackingBobbinC);
router.delete('/packing/box/:order_no/:stack_no/:box_no', deletePackingBoxC);

export default router;
