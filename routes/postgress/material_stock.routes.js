import express from "express";
import { syncMaterialStockC } from "../../controller/postgres/sap_integrate/preform_data/material_stock.controller.js";
import { queryMaterialStockC } from "../../controller/postgres/sap_integrate/preform_data/material_stock_query.controller.js";

const router = express.Router();

// Manually trigger a SAP material-stock -> preform_data sync
router.post("/material-stock/sync", syncMaterialStockC);

// Query SAP material-stock and return the stock list (no DB writes)
router.post("/material-stock/query", queryMaterialStockC);

export default router;
