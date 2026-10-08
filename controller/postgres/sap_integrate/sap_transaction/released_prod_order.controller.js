import pool from "../../../../db/postgres.js";
import { findReleasedProdOrder } from "../../../../services/sap_integrate/sap_transaction/sap_transaction_insert.service.js";

/**
 * GET /api/sap-transaction/released-order/:fgMaterialCode
 *
 * Find the released process order for a given finished goods material code.
 * 
 * Query params:
 *   - orderType: (optional) Filter by order type (DRAW/PT/REW/COLOR)
 *
 * Returns:
 *   - order_no: Process order number
 *   - order_qty: Order quantity
 *   - gr_qty: Goods receipt quantity
 */
export const getReleasedProdOrderC = async (req, res) => {
    const client = await pool.connect();

    try {
        const { fgMaterialCode } = req.params;
        const { orderType } = req.query;

        if (!fgMaterialCode) {
            return res.status(400).json({
                success: false,
                message: "fgMaterialCode is required",
            });
        }

        const order = await findReleasedProdOrder(
            fgMaterialCode,
            client,
            orderType || null
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: `No released (REL/PCNF) process order found for material code "${fgMaterialCode}"`,
                data: null,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Released process order found",
            data: order,
        });
    } catch (error) {
        console.error("[Get Released Prod Order] Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    } finally {
        client.release();
    }
};
