import express from 'express';
import { createPreformVendorC, getPreformVendorC, updatePreformVendorC } from '../../controller/postgres/preform_vendor/preform_vendor.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get("/getpreformvendor", getPreformVendorC);
router.post("/createpreformvendor", authMiddleware, createPreformVendorC);
router.put("/admin/preformvendor/:preform_vendor_id", authMiddleware, updatePreformVendorC);

export default router;
