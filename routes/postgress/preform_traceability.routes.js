import express from "express";
import {
    getPreformTraceabilityC,
    exportPreformTraceabilityC,
} from "../../controller/postgres/preform_traceability/preform_traceability.controller.js";
import { authMiddleware } from "../../middleware/aut_middleware.js";

const router = express.Router();

// JSON data for a bobbin's preform traceability
router.get("/preform-traceability", authMiddleware, getPreformTraceabilityC);

// Excel export for a bobbin's preform traceability
router.get("/preform-traceability/export", authMiddleware, exportPreformTraceabilityC);

export default router;
