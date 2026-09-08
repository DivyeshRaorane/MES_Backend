import express from "express";
import { postInspectionLotUdC } from "../../controller/postgres/sap_integrate/inspection_lot/inspection_lot_ud.controller.js";

const router = express.Router();

// Post inspection lot Usage Decision(s) to SAP.
// Body may be a single object, an array, or { lots: [...] } for bulk.
router.post("/sap/inspection-lot/ud", postInspectionLotUdC);

export default router;
