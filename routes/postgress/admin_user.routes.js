import express from 'express';
import { getAllUsersC, getDepartmentsC, createDepartmentC, updateDepartmentC, createUserC, updateUserC, changeStatusC } from '../../controller/postgres/admin/admin_user.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/users', getAllUsersC);
router.get('/admin/departments', getDepartmentsC);
router.post('/admin/departments', requireRole("admin"), createDepartmentC);
router.put('/admin/departments/:id', requireRole("admin"), updateDepartmentC);
router.post('/admin/users', requireRole("admin"), createUserC);
router.put('/admin/users/:emp_id', requireRole("admin"), updateUserC);
router.patch('/admin/users/:emp_id/status', requireRole("admin"), changeStatusC);

export default router;
