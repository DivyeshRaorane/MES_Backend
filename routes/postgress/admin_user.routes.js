import express from 'express';
import { getAllUsersC, getDepartmentsC, createDepartmentC, updateDepartmentC, createUserC, updateUserC, changeStatusC } from '../../controller/postgres/admin/admin_user.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/users', authMiddleware, getAllUsersC);
router.get('/admin/departments', getDepartmentsC);
router.post('/admin/departments', authMiddleware, createDepartmentC);
router.put('/admin/departments/:id', authMiddleware, updateDepartmentC);
router.post('/admin/users', authMiddleware, createUserC);
router.put('/admin/users/:emp_id', authMiddleware, updateUserC);
router.patch('/admin/users/:emp_id/status', authMiddleware, changeStatusC);

export default router;
