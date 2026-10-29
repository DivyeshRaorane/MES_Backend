import express from 'express';
import { createPreformVendorC, getPreformVendorC, updatePreformVendorC } from '../../controller/postgres/preform_vendor/preform_vendor.controller.js';

const router = express.Router();

router.get("/getpreformvendor", getPreformVendorC);
router.get("/preform-vendor", getPreformVendorC);
router.post("/createpreformvendor", createPreformVendorC);
router.put("/admin/preformvendor/:preform_vendor_id", updatePreformVendorC);

export default router;
