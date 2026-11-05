import express from 'express';
import { getAllQcUsersAdminC, createQcUserAdminC, updateQcUserAdminC } from '../../controller/postgres/admin/qc_user_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/qcusers', getAllQcUsersAdminC);
router.post('/admin/qcusers', requireRole("admin"), createQcUserAdminC);
router.put('/admin/qcusers/:qc_user_id', requireRole("admin"), updateQcUserAdminC);

export default router;
