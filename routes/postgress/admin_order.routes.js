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

const router = express.Router();

// All endpoints require a Bearer JWT.

// Materials dropdown (materials for material-code selects).
router.get("/materials", getMaterialsForDropdownC);

// Orders.
router.get("/orders", getAllOrdersC);
router.get("/orders/:orderNo", getOrderByNoC);
router.put("/orders/:orderNo", updateOrderC);
// Enable/disable (soft-delete + restore).
router.patch("/orders/:orderNo/status", setOrderActiveC);
router.delete("/orders/:orderNo", deleteOrderC);

// Create a process order in SAP.
router.post("/process-order/create", createProcessOrderC);

// Technically complete (TECO) a process order in SAP.
router.post("/process-order/teco/:orderNo", tecoProcessOrderC);

// Change a process order's total quantity in SAP.
router.post("/process-order/qty-change/:orderNo", changeProcessOrderQtyC);

export default router;
