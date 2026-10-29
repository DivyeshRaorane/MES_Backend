import express from "express";
import { addPreformStockController } from "../../controller/postgres/preform_stock_add/preform_stock_add.controller.js";

const router = express.Router();

router.post("/preform-stock-add", addPreformStockController);

export default router;
