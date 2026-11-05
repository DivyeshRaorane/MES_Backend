import express from 'express';
import { createPreformVendorC, getPreformVendorC, updatePreformVendorC } from '../../controller/postgres/preform_vendor/preform_vendor.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get("/getpreformvendor", getPreformVendorC);
router.get("/preform-vendor", getPreformVendorC);

// Admin write routes (JWT is checked globally in app.js; role must be admin).
router.post("/admin/preformvendor", requireRole("admin"), createPreformVendorC);
router.put("/admin/preformvendor/:preform_vendor_id", requireRole("admin"), updatePreformVendorC);

// DEPRECATED: use POST /api/admin/preformvendor. Remove after the frontend switches.
router.post("/createpreformvendor", requireRole("admin"), createPreformVendorC);

export default router;
