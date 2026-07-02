import express from 'express';
import { createPtAllocationC,getPTAllocatedSpoolC, getPTRejectedSpoolC, ptWipC } from '../../controller/postgres/pt_allocation/pt_allocation.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post("/createptallocation",authMiddleware, createPtAllocationC);
router.get("/getptallocatedspool", getPTAllocatedSpoolC);
router.get("/getptrejectedspool", getPTRejectedSpoolC);
router.get("/getptwip", ptWipC );

export default router;