import express from 'express';
import { getAllQcUsersAdminC, createQcUserAdminC, updateQcUserAdminC } from '../../controller/postgres/admin/qc_user_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/qcusers', authMiddleware, getAllQcUsersAdminC);
router.post('/admin/qcusers', authMiddleware, createQcUserAdminC);
router.put('/admin/qcusers/:qc_user_id', authMiddleware, updateQcUserAdminC);

export default router;
