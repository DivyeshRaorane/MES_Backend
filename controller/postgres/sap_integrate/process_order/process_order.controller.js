import { syncProcessOrders } from "../../../../services/sap_integrate/process_order/process_order.service.js";

/**
 * POST /api/process-order/sync
 *
 * Body (optional):
 * {
 *   "date": "YYYY-MM-DD"   // omit or leave empty to fetch ALL orders
 * }
 *
 * Fetches process orders from SAP for the given date and syncs them into
 * order_hdr / order_comp / order_opr: new orders are inserted and orders
 * already present in order_hdr are updated in place.
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
