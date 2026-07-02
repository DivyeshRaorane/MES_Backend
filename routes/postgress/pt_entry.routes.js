import express from 'express';
import { ptEntryC, getSpoolDetailsForPtEntryC, getPTFlawsC, getPTLogsC } from '../../controller/postgres/pt_entry/pt_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';


const router = express.Router();

router.post("/ptentry",authMiddleware, ptEntryC);
router.get("/getspooldetailsforpt/:spool_id", getSpoolDetailsForPtEntryC);
router.get("/getptflaws", getPTFlawsC)
router.get("/getptlogs", getPTLogsC)


export default router;