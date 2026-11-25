import express from "express";
import { authMiddleware, requireRole } from "../../middleware/aut_middleware.js";
import {
    insertDrawSpecialRemarkC,
    getDrawSpecialRemarkC,
    updateDrawSpecialRemarkDisableC,
    updateDrawSpecialRemarkTextC,
} from "../../controller/postgres/draw_entry/draw_special_remark/draw_special_remark.controller.js";

const router = express.Router();

// GET: any logged-in user. Create/update: admin role only.
router.get("/drawspecialremark", authMiddleware, getDrawSpecialRemarkC);
router.post("/drawspecialremark", authMiddleware, requireRole("admin"), insertDrawSpecialRemarkC);
router.put("/drawspecialremark/:id", authMiddleware, requireRole("admin"), updateDrawSpecialRemarkDisableC);

router.put("/drawspecialremark/:id/remark", authMiddleware, requireRole("admin"), updateDrawSpecialRemarkTextC);

export default router;
