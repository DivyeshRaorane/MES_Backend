import express from 'express';
import {
  getAllPTUsersC,
  createPTUserC,
  updatePTUserC,
  deletePTUserC,
} from '../../controller/postgres/admin/pt_user_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/ptusers', getAllPTUsersC);
router.post('/admin/ptusers', authMiddleware, createPTUserC);
router.put('/admin/ptusers/:id', authMiddleware, updatePTUserC);
router.delete('/admin/ptusers/:id', authMiddleware, deletePTUserC);

export default router;
