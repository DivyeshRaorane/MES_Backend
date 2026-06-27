import express from 'express';
import { ptEntryC, getSpoolDetailsForPtEntryC } from '../../controller/postgres/pt_entry/pt_entry.controller.js';

const router = express.Router();

router.post("/ptentry", ptEntryC);
router.get("/getspooldetailsforpt/:spool_id", getSpoolDetailsForPtEntryC);


export default router;