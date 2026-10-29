import express from 'express';
import { runAllocationC } from '../../controller/postgres/customer_allocation/customer_allocation.controller.js';

const router = express.Router();

router.post('/allocation/run', runAllocationC);

export default router;
