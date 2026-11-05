import express from 'express';
import {
    getAllFiberCutIndicationsC,
    getFiberCutIndicationByIdC,
    createFiberCutIndicationC,
    updateFiberCutIndicationC,
    deleteFiberCutIndicationC
} from '../../controller/postgres/fiber_cut_indication/fiber_cut_indication.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Fiber Cut Indication reads (unchanged)
router.get('/fiber-cut-indication', getAllFiberCutIndicationsC);
router.get('/fiber-cut-indication/:id', getFiberCutIndicationByIdC);

// Admin write routes (JWT is checked globally in app.js; role must be admin).
router.post('/admin/fibercutindications', requireRole("admin"), createFiberCutIndicationC);
router.put('/admin/fibercutindications/:id', requireRole("admin"), updateFiberCutIndicationC);
router.delete('/admin/fibercutindications/:id', requireRole("admin"), deleteFiberCutIndicationC);

// DEPRECATED: use /api/admin/fibercutindications. Remove after the frontend switches.
router.post('/fiber-cut-indication', requireRole("admin"), createFiberCutIndicationC);
router.put('/fiber-cut-indication/:id', requireRole("admin"), updateFiberCutIndicationC);
router.delete('/fiber-cut-indication/:id', requireRole("admin"), deleteFiberCutIndicationC);

export default router;
