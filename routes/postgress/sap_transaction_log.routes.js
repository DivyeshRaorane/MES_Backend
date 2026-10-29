import express from "express";
import { getSapTransactionLogsC } from "../../controller/postgres/sap_transaction_log/sap_transaction_log.controller.js";
import { requireRole } from "../../middleware/aut_middleware.js";

const router = express.Router();

// GET /api/saptransactionlogs
// Auth required + role must be admin.
// Optional query params: prod_order, batch, status, operation, from_date, to_date
router.get(
    "/saptransactionlogs",
    requireRole("admin"),
    getSapTransactionLogsC
);

export default router;
