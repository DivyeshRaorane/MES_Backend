import express from "express";
import { getPendingUserDecisionsC } from "../../controller/postgres/sap_integrate/inspection_lot/user_decision.controller.js";

const router = express.Router();

// Bobbins awaiting a user decision (pending inspection-lot UD).
// Optional query filters: ?bobbin_no=<partial>&inspection_lot=<exact>
router.get("/user-decision/pending", getPendingUserDecisionsC);

export default router;
