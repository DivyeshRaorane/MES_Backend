import {
    postPendingSapTransactions,
    postSingleSapTransaction,
} from "../../../../services/sap_integrate/sap_transaction/sap_transaction_post.service.js";

/**
 * POST /api/sap-transaction/post
 *
 * Manual trigger (button click) to post all pending sap_transaction rows
 * (status = false) to SAP — FG confirmations and SCRAP goods issues.
 */
export const postPendingSapTransactionsC = async (req, res) => {
    try {
        const summary = await postPendingSapTransactions();

        return res.status(200).json({
            success: true,
            message: "SAP transaction posting completed",
            summary,
        });
    } catch (error) {
        console.error("[SAP Transaction Post] Bulk error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /api/sap-transaction/post/:transactionId
 *
 * Manual trigger to post a single sap_transaction row (and, for FG, the rest of
 * its prod_order/operation group) to SAP.
 */
export const postSingleSapTransactionC = async (req, res) => {
    try {
        const transactionId = req.params.transactionId ?? req.body?.transaction_id;

        const result = await postSingleSapTransaction(transactionId);

        return res.status(200).json({
            success: true,
            message: result.posted
                ? "SAP transaction posted"
                : `SAP transaction not posted (${result.reason})`,
            result,
        });
    } catch (error) {
        console.error("[SAP Transaction Post] Single error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
