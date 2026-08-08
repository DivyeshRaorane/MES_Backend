import express from 'express';
import {
  getAllRewMachinesC,
  createRewMachineC,
  updateRewMachineC,
  deleteRewMachineC,
} from '../../controller/postgres/admin/rew_machine_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/rewmachines', getAllRewMachinesC);
router.post('/admin/rewmachines', authMiddleware, createRewMachineC);
router.put('/admin/rewmachines/:id', authMiddleware, updateRewMachineC);
router.delete('/admin/rewmachines/:id', authMiddleware, deleteRewMachineC);

export default router;
