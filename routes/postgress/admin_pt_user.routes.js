import express from 'express';
import {
  getAllPTUsersC,
  createPTUserC,
  updatePTUserC,
  deletePTUserC,
} from '../../controller/postgres/admin/pt_user_admin.controller.js';

const router = express.Router();

router.get('/admin/ptusers', getAllPTUsersC);
router.post('/admin/ptusers', createPTUserC);
router.put('/admin/ptusers/:id', updatePTUserC);
router.delete('/admin/ptusers/:id', deletePTUserC);

export default router;
