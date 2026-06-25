import express from 'express';
import { drawEntryC, getDrawEntryDataForPTAC } from '../../controller/postgres/draw_entry/draw_entry.controller.js';

const router = express.Router();

router.post('/drawentry',drawEntryC);
router.get("/getdrawentryforpta", getDrawEntryDataForPTAC)

export default router;