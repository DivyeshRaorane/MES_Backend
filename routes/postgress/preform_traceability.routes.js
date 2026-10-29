import express from "express";
import {
    getPreformTraceabilityC,
    exportPreformTraceabilityC,
} from "../../controller/postgres/preform_traceability/preform_traceability.controller.js";

const router = express.Router();

// JSON data for a bobbin's preform traceability
router.get("/preform-traceability", getPreformTraceabilityC);

// Excel export for a bobbin's preform traceability
router.get("/preform-traceability/export", exportPreformTraceabilityC);

export default router;
