import express from 'express';
import { createPtAllocationC } from '../../controller/postgres/pt_allocation/pt_allocation.controller.js';

const router = express.Router();

router.post("/createptallocation", createPtAllocationC);

export default router;