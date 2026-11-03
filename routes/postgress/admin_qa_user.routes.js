import express from 'express';
import { createQaUserAdminC, updateQaUserAdminC } from '../../controller/postgres/admin/qa_user_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Writes: admin role (JWT is checked globally in app.js).
router.post('/admin/qausers', requireRole("admin"), createQaUserAdminC);
router.put('/admin/qausers/:qa_user_id', requireRole("admin"), updateQaUserAdminC);

export default router;
