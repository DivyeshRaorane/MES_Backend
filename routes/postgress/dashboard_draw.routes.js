import express from "express";
import { getDrawTowersDashboardC } from "../../controller/postgres/dashboard/dashboard_draw.controller.js";
const router = express.Router();
router.get("/dashboard/draw-towers", getDrawTowersDashboardC);
export default router;
