import express from 'express';
import { createH2ChamberC, getH2ChambersC } from '../../controller/postgres/h2_chamber/h2_chamber.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/geth2chambers', getH2ChambersC);

// Admin write routes (JWT is checked globally in app.js; role must be admin).
router.post('/admin/h2chambers', requireRole("admin"), createH2ChamberC);

// DEPRECATED: use POST /api/admin/h2chambers. Remove after the frontend switches.
router.post('/createh2chamber', requireRole("admin"), createH2ChamberC);

export default router;
