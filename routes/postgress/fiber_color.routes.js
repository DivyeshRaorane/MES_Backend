import express from "express";
import {
  createFiberColorC,
  getFiberColorC,
  getFiberColorByIdC,
  updateFiberColorC,
} from "../../controller/postgres/fiber_color/fiber_color.controller.js";
import { requireRole } from "../../middleware/aut_middleware.js";

const router = express.Router();

router.get("/getfibercolor", getFiberColorC);
router.get("/fiber-color/:fiber_color_id", getFiberColorByIdC);

// Admin write routes (JWT is checked globally in app.js; role must be admin).
router.post("/admin/fibercolors", requireRole("admin"), createFiberColorC);
router.put("/admin/fibercolors/:fiber_color_id", requireRole("admin"), updateFiberColorC);

// DEPRECATED: use POST /api/admin/fibercolors. Remove after the frontend switches.
router.post("/createfibercolor", requireRole("admin"), createFiberColorC);

export default router;
