import { tecoProcessOrderInSAP } from "../../../../services/sap_integrate/process_order/process_order_teco.service.js";

// POST /api/admin/process-order/teco/:orderNo
export const tecoProcessOrderC = async (req, res) => {
    try {
        // updated_by comes only from the authenticated token, never the body.
        const updatedBy = req.user?.emp_id ?? req.user?.userId ?? null;

        const data = await tecoProcessOrderInSAP(req.params.orderNo, updatedBy);

        let message = `${data.message} (Order ${data.order_no})`;
        if (data.db_error) message += `. Warning: could not update MES table (${data.db_error})`;
        if (data.sync?.message) message += `. ${data.sync.message}`;

        return res.status(200).json({ success: true, message, data });
    } catch (error) {
        if (error.code === "VALIDATION") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.code === "SAP_REJECTED" || error.code === "SAP_HTTP_ERROR") {
            console.error("[Process Order TECO]", error.message);
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
