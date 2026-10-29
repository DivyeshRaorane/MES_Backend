import express from "express";
import { getProductionReportC } from "../../controller/postgres/reports/production_report.controller.js";

const router = express.Router();

// Generate and download production report Excel
router.get("/reports/production-report", getProductionReportC);

export default router;
