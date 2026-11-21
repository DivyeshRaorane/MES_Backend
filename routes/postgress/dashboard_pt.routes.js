import express from "express";
import { getPtMachinesDashboardC } from "../../controller/postgres/dashboard/pt/dashboard_pt.controller.js";
const router = express.Router();
router.get("/dashboard/pt-machines", getPtMachinesDashboardC);
export default router;
