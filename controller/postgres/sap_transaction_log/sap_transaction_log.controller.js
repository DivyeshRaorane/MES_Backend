import { getSapTransactionLogsS } from "../../../services/sap_integrate/sap_transaction_log_get.service.js";

/**
 * GET SAP transaction logs.
 *
 * All query params are optional. When omitted, that filter is not applied
 * (i.e. all values for that dimension are returned):
 *   - prod_order
 *   - batch
 *   - status
 *   - operation
 *   - from_date  (created_at lower bound)
 *   - to_date    (created_at upper bound)
 */
export const getSapTransactionLogsC = async (req, res) => {
    try {
        const { prod_order, batch, status, operation, from_date, to_date } = req.query;

        const data = await getSapTransactionLogsS({
            prod_order,
            batch,
            status,
            operation,
            from_date,
            to_date,
        });

        res.status(200).json({
            success: true,
            message: "Successfully fetched SAP transaction logs",
            count: data.length,
            data,
        });
    } catch (error) {
        console.error("Get SAP Transaction Logs Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
