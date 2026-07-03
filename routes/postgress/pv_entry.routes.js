import express from 'express';
import { getBobbinForPvC, pvEntryC } from '../../controller/postgres/pv_entry/pv_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get("/getbobbinforpv/:bobbin_id", getBobbinForPvC);
router.post("/pventry", authMiddleware, pvEntryC);

export default router;
