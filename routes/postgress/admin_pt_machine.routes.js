import express from 'express';
import {
  getAllPTMachinesC,
  createPTMachineAdminC,
  updatePTMachineC,
  deletePTMachineC,
} from '../../controller/postgres/admin/pt_machine_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/ptmachines', getAllPTMachinesC);
router.post('/admin/ptmachines', authMiddleware, createPTMachineAdminC);
router.put('/admin/ptmachines/:id', authMiddleware, updatePTMachineC);
router.delete('/admin/ptmachines/:id', authMiddleware, deletePTMachineC);

export default router;
