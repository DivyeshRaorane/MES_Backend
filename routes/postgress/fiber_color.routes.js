import express from "express";
import {
  createFiberColorC,
  getFiberColorC,
  getFiberColorByIdC,
  updateFiberColorC,
} from "../../controller/postgres/fiber_color/fiber_color.controller.js";
import { authMiddleware } from "../../middleware/aut_middleware.js";

const router = express.Router();

router.post("/createfibercolor", authMiddleware, createFiberColorC);
router.get("/getfibercolor", getFiberColorC);
router.get("/fiber-color/:fiber_color_id", getFiberColorByIdC);
router.put("/admin/fibercolors/:fiber_color_id", authMiddleware, updateFiberColorC);

export default router;
