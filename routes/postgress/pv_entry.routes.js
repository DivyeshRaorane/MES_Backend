import express from 'express';
import { getBobbinForPvC, updateBobbinColorC, pvEntryC, getBobbinForRePvC, rePvEntryC } from '../../controller/postgres/pv_entry/pv_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Online PV
router.get("/getbobbinforpv/:bobbin_no", getBobbinForPvC);
router.patch("/updatebobbincolor/:bobbin_no", updateBobbinColorC);
router.post("/pventry", authMiddleware, pvEntryC);

// Re-PV
router.get("/getbobbinforrepv/:bobbin_no", getBobbinForRePvC);
router.put("/repventry", authMiddleware, rePvEntryC);

export default router;
