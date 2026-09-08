import { syncProcessOrders } from "../../../../services/sap_integrate/process_order/process_order.service.js";

/**
 * POST /api/process-order/sync
 *
 * Body (optional):
 * {
 *   "date": "YYYY-MM-DD"   // defaults to today if omitted
 * }
 *
 * Fetches process orders from SAP /getorder for the given date, skips orders
 * already present in order_hdr, and inserts new ones into
 * order_hdr / order_comp / order_opr.
 */
export const syncProcessOrdersC = async (req, res) => {
    try {
        const date = req.body?.date;

        const summary = await syncProcessOrders(date);

        return res.status(200).json({
            success: true,
            message: "Process order sync completed",
            summary,
        });
    } catch (error) {
        console.error("[Process Order] Sync error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
