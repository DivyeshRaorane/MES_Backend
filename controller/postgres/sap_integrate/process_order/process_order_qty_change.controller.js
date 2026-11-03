import { changeProcessOrderQtyInSAP } from "../../../../services/sap_integrate/process_order/process_order_qty_change.service.js";

// POST /api/admin/process-order/qty-change/:orderNo   body: { "TotalQuantity": "150.000" }
export const changeProcessOrderQtyC = async (req, res) => {
    try {
        // updated_by comes only from the authenticated token, never the body.
        const updatedBy = req.user?.emp_id ?? req.user?.userId ?? null;

        const data = await changeProcessOrderQtyInSAP(req.params.orderNo, req.body?.TotalQuantity, updatedBy);

        let message = `${data.message} (Order ${data.order_no}: ${data.previous_qty ?? "?"} → ${data.new_qty})`;
        if (data.db_error) message += `. Warning: could not update MES table (${data.db_error})`;
        else if (!data.in_mes_table) message += ". Note: order was not created from MES, so no MES record was updated";

        return res.status(200).json({ success: true, message, data });
    } catch (error) {
        if (error.code === "VALIDATION") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.code === "SAP_REJECTED" || error.code === "SAP_HTTP_ERROR") {
            console.error("[Process Order Qty Change]", error.message);
            return res.status(502).json({
                success: false,
                message: `SAP error: ${error.message}`,
                sap_response: error.sap_response ?? null,
            });
        }
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
