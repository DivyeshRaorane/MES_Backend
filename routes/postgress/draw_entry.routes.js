import express from 'express';
import { drawEntryC, getDrawEntryDataForPTAC } from '../../controller/postgres/draw_entry/draw_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';
const router = express.Router();

router.post('/drawentry',authMiddleware,drawEntryC);
router.get("/getdrawentryforpta", getDrawEntryDataForPTAC)

export default router;