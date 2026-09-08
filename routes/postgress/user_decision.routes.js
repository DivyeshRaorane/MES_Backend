import express from "express";
import { getPendingUserDecisionsC } from "../../controller/postgres/sap_integrate/inspection_lot/user_decision.controller.js";
import { authMiddleware } from "../../middleware/aut_middleware.js";

const router = express.Router();

// Bobbins awaiting a user decision (pending inspection-lot UD).
// Optional query filters: ?bobbin_no=<partial>&inspection_lot=<exact>
router.get("/user-decision/pending", authMiddleware, getPendingUserDecisionsC);

export default router;
