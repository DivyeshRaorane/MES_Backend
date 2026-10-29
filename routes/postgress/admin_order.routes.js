import express from "express";
import {
    getAllOrdersC,
    getOrderByNoC,
    createOrderC,
    updateOrderC,
    deleteOrderC,
    setOrderActiveC,
} from "../../controller/postgres/admin_order/admin_order.controller.js";
import { getMaterialsForDropdownC } from "../../controller/postgres/admin_order/admin_materials.controller.js";

const router = express.Router();

// All endpoints require a Bearer JWT.

// Materials dropdown (materials for material-code selects).
router.get("/materials", getMaterialsForDropdownC);

// Orders.
router.get("/orders", getAllOrdersC);
router.get("/orders/:orderNo", getOrderByNoC);
router.post("/orders", createOrderC);
router.put("/orders/:orderNo", updateOrderC);
// Enable/disable (soft-delete + restore).
router.patch("/orders/:orderNo/status", setOrderActiveC);
router.delete("/orders/:orderNo", deleteOrderC);

export default router;
