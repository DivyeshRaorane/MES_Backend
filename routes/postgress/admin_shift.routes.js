import express from 'express';
import { createShiftC, updateShiftC } from '../../controller/postgres/admin/shift_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Writes: admin role (JWT is checked globally in app.js).
router.post('/admin/shifts', requireRole("admin"), createShiftC);
router.put('/admin/shifts/:shift_id', requireRole("admin"), updateShiftC);

export default router;
