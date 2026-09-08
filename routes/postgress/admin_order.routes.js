import express from "express";
import {
    getAllOrdersC,
    getOrderByNoC,
    createOrderC,
    updateOrderC,
} from "../../controller/postgres/admin_order/admin_order.controller.js";
import { getMaterialsForDropdownC } from "../../controller/postgres/admin_order/admin_materials.controller.js";
import { authMiddleware } from "../../middleware/aut_middleware.js";

const router = express.Router();

// All endpoints require a Bearer JWT.

// Materials dropdown (materials for material-code selects).
router.get("/materials", authMiddleware, getMaterialsForDropdownC);

// Orders.
router.get("/orders", authMiddleware, getAllOrdersC);
router.get("/orders/:orderNo", authMiddleware, getOrderByNoC);
router.post("/orders", authMiddleware, createOrderC);
router.put("/orders/:orderNo", authMiddleware, updateOrderC);

export default router;
