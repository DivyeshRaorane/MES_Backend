import express from "express";
import {
    postPendingSapTransactionsC,
    postSingleSapTransactionC,
} from "../../controller/postgres/sap_integrate/sap_transaction/sap_transaction_post.controller.js";

const router = express.Router();

// Bulk: post all pending sap_transaction rows (status = false) to SAP
router.post("/sap-transaction/post", postPendingSapTransactionsC);

// Single: post one sap_transaction row (FG posts its whole group) to SAP
router.post("/sap-transaction/post/:transactionId", postSingleSapTransactionC);

export default router;
