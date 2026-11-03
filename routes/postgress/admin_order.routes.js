import express from "express";
import {
    getAllOrdersC,
    getOrderByNoC,
    updateOrderC,
    deleteOrderC,
    setOrderActiveC,
} from "../../controller/postgres/admin_order/admin_order.controller.js";
import { getMaterialsForDropdownC } from "../../controller/postgres/admin_order/admin_materials.controller.js";
import { createProcessOrderC } from "../../controller/postgres/sap_integrate/process_order/process_order_create.controller.js";
import { tecoProcessOrderC } from "../../controller/postgres/sap_integrate/process_order/process_order_teco.controller.js";
import { changeProcessOrderQtyC } from "../../controller/postgres/sap_integrate/process_order/process_order_qty_change.controller.js";
import { requireRole } from "../../middleware/aut_middleware.js";

const router = express.Router();

// All endpoints require a Bearer JWT (checked globally in app.js).
// GET: any logged-in user. Writes: admin role.

// Materials dropdown (materials for material-code selects).
router.get("/materials", getMaterialsForDropdownC);

// Orders.
router.get("/orders", getAllOrdersC);
router.get("/orders/:orderNo", getOrderByNoC);
router.put("/orders/:orderNo", requireRole("admin"), updateOrderC);
// Enable/disable (soft-delete + restore).
router.patch("/orders/:orderNo/status", requireRole("admin"), setOrderActiveC);
router.delete("/orders/:orderNo", requireRole("admin"), deleteOrderC);

// Create a process order in SAP.
router.post("/process-order/create", requireRole("admin"), createProcessOrderC);

// Technically complete (TECO) a process order in SAP.
router.post("/process-order/teco/:orderNo", requireRole("admin"), tecoProcessOrderC);

// Change a process order's total quantity in SAP.
router.post("/process-order/qty-change/:orderNo", requireRole("admin"), changeProcessOrderQtyC);

export default router;
