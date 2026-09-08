import { syncMaterialStock } from "../../../../services/sap_integrate/preform_data/material_stock.service.js";

/**
 * POST /api/material-stock/sync
 *
 * Body (all optional):
 * {
 *   "materials": ["000000001000000004", "..."]   // or a comma-separated string
 * }
 *
 * If no materials are supplied, the list configured in
 * SAP_MATERIAL_STOCK_MATERIALS (.env) is used.
 */
export const syncMaterialStockC = async (req, res) => {
    try {
        const materials = req.body?.materials;

        const summary = await syncMaterialStock(materials);

        return res.status(200).json({
            success: true,
            message: "Material stock sync completed",
            summary,
        });
    } catch (error) {
        console.error("[Material Stock] Sync error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
