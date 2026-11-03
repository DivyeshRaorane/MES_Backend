import express from 'express';
import {
  getAllPTUsersC,
  createPTUserC,
  updatePTUserC,
  deletePTUserC,
} from '../../controller/postgres/admin/pt_user_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/ptusers', getAllPTUsersC);
router.post('/admin/ptusers', requireRole("admin"), createPTUserC);
router.put('/admin/ptusers/:id', requireRole("admin"), updatePTUserC);
router.delete('/admin/ptusers/:id', requireRole("admin"), deletePTUserC);

export default router;
