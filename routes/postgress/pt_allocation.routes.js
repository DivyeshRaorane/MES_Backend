import express from 'express';
import { createPtAllocationC,getPTAllocatedSpoolC } from '../../controller/postgres/pt_allocation/pt_allocation.controller.js';

const router = express.Router();

router.post("/createptallocation", createPtAllocationC);
router.get("/getptallocatedspool", getPTAllocatedSpoolC);

export default router;