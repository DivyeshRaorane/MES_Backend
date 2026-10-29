import express from 'express';
import { getAllUsersC, getDepartmentsC, createDepartmentC, updateDepartmentC, createUserC, updateUserC, changeStatusC } from '../../controller/postgres/admin/admin_user.controller.js';

const router = express.Router();

router.get('/admin/users', getAllUsersC);
router.get('/admin/departments', getDepartmentsC);
router.post('/admin/departments', createDepartmentC);
router.put('/admin/departments/:id', updateDepartmentC);
router.post('/admin/users', createUserC);
router.put('/admin/users/:emp_id', updateUserC);
router.patch('/admin/users/:emp_id/status', changeStatusC);

export default router;
