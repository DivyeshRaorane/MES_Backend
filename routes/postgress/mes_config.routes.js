import express from 'express';
import { getAllConfigsC, createConfigC, updateConfigC, toggleConfigStatusC } from '../../controller/postgres/admin/mes_config.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/mes-config', getAllConfigsC);
router.post('/admin/mes-config', requireRole("admin"), createConfigC);
router.put('/admin/mes-config/:id', requireRole("admin"), updateConfigC);
router.patch('/admin/mes-config/:id/status', requireRole("admin"), toggleConfigStatusC);

export default router;
