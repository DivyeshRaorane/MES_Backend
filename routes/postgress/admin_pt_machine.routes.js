import express from 'express';
import {
  getAllPTMachinesC,
  createPTMachineAdminC,
  updatePTMachineC,
  deletePTMachineC,
} from '../../controller/postgres/admin/pt_machine_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/ptmachines', getAllPTMachinesC);
router.post('/admin/ptmachines', requireRole("admin"), createPTMachineAdminC);
router.put('/admin/ptmachines/:id', requireRole("admin"), updatePTMachineC);
router.delete('/admin/ptmachines/:id', requireRole("admin"), deletePTMachineC);

export default router;
