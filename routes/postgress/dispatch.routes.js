import express from 'express';
import { getTcC, markDispatchedC } from '../../controller/postgres/dispatch/dispatch.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/dispatch/tc/:tc_number', authMiddleware, getTcC);
router.post('/dispatch/mark-dispatched', authMiddleware, markDispatchedC);

export default router;
