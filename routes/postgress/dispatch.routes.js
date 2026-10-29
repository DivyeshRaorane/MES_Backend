import express from 'express';
import { getTcC, markDispatchedC } from '../../controller/postgres/dispatch/dispatch.controller.js';

const router = express.Router();

router.get('/dispatch/tc/:tc_number', getTcC);
router.post('/dispatch/mark-dispatched', markDispatchedC);

export default router;
