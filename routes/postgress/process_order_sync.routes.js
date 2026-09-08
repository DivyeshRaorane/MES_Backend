import express from "express";
import { syncProcessOrdersC } from "../../controller/postgres/sap_integrate/process_order/process_order.controller.js";

const router = express.Router();

// Manually trigger a SAP /getorder -> order_hdr/order_comp/order_opr sync
router.post("/process-order/sync", syncProcessOrdersC);

export default router;
