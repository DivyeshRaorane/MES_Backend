import express from "express";
import { getProductionReportC } from "../../controller/postgres/reports/production_report.controller.js";
import { authMiddleware } from "../../middleware/aut_middleware.js";

const router = express.Router();

// Generate and download production report Excel
router.get("/reports/production-report", authMiddleware, getProductionReportC);

export default router;
