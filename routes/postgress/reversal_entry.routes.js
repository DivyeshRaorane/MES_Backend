import express from "express";
import {
    reverseDrawEntryC,
    reversePtEntryC,
    reverseUdEntryC,
    makeUdEntryC,
} from "../../controller/postgres/sap_integrate/reversal_entry/reversal_entry.controller.js";

const router = express.Router();

// Draw (spool) reversal. body: { spool_id }
router.post("/reversal/draw", reverseDrawEntryC);

// PT reversal. body: { bobbin_no }
router.post("/reversal/pt", reversePtEntryC);

// UD reversal. body: { bobbin_no, ud_type }
router.post("/reversal/ud", reverseUdEntryC);

// Make UD again after a UD reversal. body: { bobbin_no, ud_type }
router.post("/reversal/ud/make", makeUdEntryC);

export default router;
