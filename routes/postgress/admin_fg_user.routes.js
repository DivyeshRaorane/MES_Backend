import express from 'express';
import { createFgUserAdminC, updateFgUserAdminC } from '../../controller/postgres/admin/fg_user_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Writes: admin role (JWT is checked globally in app.js).
router.post('/admin/fgusers', requireRole("admin"), createFgUserAdminC);
router.put('/admin/fgusers/:fg_user_id', requireRole("admin"), updateFgUserAdminC);

export default router;
