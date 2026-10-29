import express from "express";
import {
  createFiberColorC,
  getFiberColorC,
  getFiberColorByIdC,
  updateFiberColorC,
} from "../../controller/postgres/fiber_color/fiber_color.controller.js";

const router = express.Router();

router.post("/createfibercolor", createFiberColorC);
router.get("/getfibercolor", getFiberColorC);
router.get("/fiber-color/:fiber_color_id", getFiberColorByIdC);
router.put("/admin/fibercolors/:fiber_color_id", updateFiberColorC);

export default router;
