import express from "express";
import {
  getConfigC, saveConfigC, getSpoolsC, getBobbinsC, getBobbinC, updateC,
} from "../../controller/postgres/qc_data_update/qc_data_update.controller.js";
import { requireRole } from "../../middleware/aut_middleware.js";
import { requireQcModuleAccess } from "../../middleware/qc_module_access.middleware.js";

const router = express.Router();
// JWT is checked globally in app.js.

// Admin only: choose which qc_entry_temp parameters may be updated.
router.put("/admin/qc-data-update/config", requireRole("admin"), saveConfigC);

// QC screen: admin, or a user who has the Quality Control module (department).
router.get("/qc-data-update/config", requireQcModuleAccess, getConfigC);
router.get("/qc-data-update/spools", requireQcModuleAccess, getSpoolsC);
router.post("/qc-data-update/bobbins", requireQcModuleAccess, getBobbinsC);
router.get("/qc-data-update/bobbin", requireQcModuleAccess, getBobbinC);
router.post("/qc-data-update/update", requireQcModuleAccess, updateC);

export default router;
