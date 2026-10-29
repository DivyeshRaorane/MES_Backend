import express from 'express';
import { createPtAllocationC,getPTAllocatedSpoolC, getPTRejectedSpoolC, ptWipC, deallocatePtC } from '../../controller/postgres/pt_allocation/pt_allocation.controller.js';

const router = express.Router();

router.post("/createptallocation", createPtAllocationC);
router.post("/deallocatept", deallocatePtC);
router.get("/getptallocatedspool", getPTAllocatedSpoolC);
router.get("/getptrejectedspool", getPTRejectedSpoolC);
router.get("/getptwip", ptWipC );

export default router;