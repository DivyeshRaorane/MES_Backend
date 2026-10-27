import express from "express";
import { addPreformStockController } from "../../controller/postgres/preform_stock_add/preform_stock_add.controller.js";
import { authMiddleware } from "../../middleware/aut_middleware.js";

const router = express.Router();

router.post("/preform-stock-add", authMiddleware, addPreformStockController);

export default router;
