import express from 'express';
import { runAllocationC } from '../../controller/postgres/customer_allocation/customer_allocation.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post('/allocation/run', authMiddleware, runAllocationC);

export default router;
