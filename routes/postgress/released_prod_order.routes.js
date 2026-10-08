import express from "express";
import { getReleasedProdOrderC } from "../../controller/postgres/sap_integrate/sap_transaction/released_prod_order.controller.js";

const router = express.Router();

/**
 * GET /api/sap-transaction/released-order/:fgMaterialCode
 * 
 * Find released process order by material code
 * Query params:
 *   - orderType: (optional) Filter by order type (DRAW/PT/REW/COLOR)
 */
router.get("/sap-transaction/released-order/:fgMaterialCode", getReleasedProdOrderC);

export default router;
