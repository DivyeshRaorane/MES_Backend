import { createProcessOrderInSAP } from "../../../../services/sap_integrate/process_order/process_order_create.service.js";

// POST /api/admin/process-order/create
// body: { ManufacturingOrderType, Material, ProductionPlant, TotalQuantity, ProductionUnit, BasicSchedulingType }
export const createProcessOrderC = async (req, res) => {
    try {
        // created_by comes only from the authenticated token, never the body.
        const createdBy = req.user?.emp_id ?? req.user?.userId ?? null;

        const data = await createProcessOrderInSAP(req.body, createdBy);

        let message = `${data.message} (Order ${data.order_no})`;
        if (!data.release.released) message += `. Release issue: ${data.release.text || "not released"}`;
        if (data.db_error) message += `. Warning: could not save in MES table (${data.db_error})`;
        if (data.sync?.message) message += `. ${data.sync.message}`;

        return res.status(200).json({ success: true, message, data });
    } catch (error) {
        if (error.code === "VALIDATION") {
            return res.status(400).json({ success: false, message: error.message, errors: error.errors });
        }
        if (error.code === "SAP_REJECTED" || error.code === "SAP_HTTP_ERROR") {
            console.error("[Process Order Create]", error.message);
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
