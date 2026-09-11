import {
    postPendingTransactions,
    postSingleTransaction,
} from "../../../../services/sap_integrate/sap_transaction/transaction_post.service.js";

/**
 * POST /api/sap-transaction/post
 *
 * Manual trigger (button click) to post all pending `transactions` rows
 * (status = false) to SAP. A single dispatcher routes each row by its `type`:
 *   FG -> prdorderconfirmation, SCRAP -> goods-issue-cost-center,
 *   MTM -> stock-transfer-material-to-material, LTL -> location-to-location,
 *   UD -> inspection-lot.
 */
export const postPendingSapTransactionsC = async (req, res) => {
    try {
        const summary = await postPendingTransactions();

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
 * Manual trigger to post a single `transactions` row to SAP. The row is routed
 * to the correct SAP API based on its `type`.
 */
export const postSingleSapTransactionC = async (req, res) => {
    try {
        const transactionId = req.params.transactionId ?? req.body?.transaction_id;

        const result = await postSingleTransaction(transactionId);

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
