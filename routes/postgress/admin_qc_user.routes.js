import express from 'express';
import { getAllQcUsersAdminC, createQcUserAdminC, updateQcUserAdminC } from '../../controller/postgres/admin/qc_user_admin.controller.js';

const router = express.Router();

router.get('/admin/qcusers', getAllQcUsersAdminC);
router.post('/admin/qcusers', createQcUserAdminC);
router.put('/admin/qcusers/:qc_user_id', updateQcUserAdminC);

export default router;
