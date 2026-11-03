import express from 'express';
import {
  getAllRewMachinesC,
  createRewMachineC,
  updateRewMachineC,
  deleteRewMachineC,
} from '../../controller/postgres/admin/rew_machine_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/rewmachines', getAllRewMachinesC);
router.post('/admin/rewmachines', requireRole("admin"), createRewMachineC);
router.put('/admin/rewmachines/:id', requireRole("admin"), updateRewMachineC);
router.delete('/admin/rewmachines/:id', requireRole("admin"), deleteRewMachineC);

export default router;
