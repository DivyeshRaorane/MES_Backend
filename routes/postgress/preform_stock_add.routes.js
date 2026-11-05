import express from "express";
import { addPreformStockController } from "../../controller/postgres/preform_stock_add/preform_stock_add.controller.js";
import { requireRole } from "../../middleware/aut_middleware.js";

const router = express.Router();

// Admin write route (JWT is checked globally in app.js; role must be admin).
router.post("/admin/preform-stock-add", requireRole("admin"), addPreformStockController);

// DEPRECATED: use POST /api/admin/preform-stock-add. Remove after the frontend switches.
router.post("/preform-stock-add", requireRole("admin"), addPreformStockController);

export default router;
