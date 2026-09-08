import { queryMaterialStock } from "../../../../services/sap_integrate/preform_data/material_stock_query.service.js";

/**
 * POST /api/material-stock/query
 *
 * Body:
 * {
 *   "Material": "SMFG652D250",   // required
 *   "Plant": "1200",             // optional (defaults to configured plant)
 *   "InventoryStockType": "01",  // optional (sent as "" when omitted)
 *   "Customer": "",              // optional
 *   "Supplier": ""               // optional
 * }
 *
 * Returns the list of stock rows (with all their details) from SAP.
 * Field names are accepted in both PascalCase (Material, Plant) and
 * lowercase (material, plant) for convenience.
 */
export const queryMaterialStockC = async (req, res) => {
    try {
        const body = req.body || {};

        const material = body.Material ?? body.material;
        const plant = body.Plant ?? body.plant;
        const inventoryStockType = body.InventoryStockType ?? body.inventoryStockType;
        const customer = body.Customer ?? body.customer ?? "";
        const supplier = body.Supplier ?? body.supplier ?? "";

        if (!material || !String(material).trim()) {
            return res.status(400).json({
                success: false,
                message: "Material is required",
            });
        }

        const { payload, rows, message, statusCode } = await queryMaterialStock({
            material,
            plant,
            inventoryStockType,
            customer,
            supplier,
        });

        return res.status(200).json({
            success: true,
            message,
            statusCode,
            query: payload,
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error("[Material Stock Query] error:", error.message);

        const status = error.statusCode || error.response?.status || 500;
        return res.status(status).json({
            success: false,
            message: error.message || "Failed to fetch material stock",
        });
    }
};

export default queryMaterialStockC;
