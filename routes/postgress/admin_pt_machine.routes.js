import express from 'express';
import {
  getAllPTMachinesC,
  createPTMachineAdminC,
  updatePTMachineC,
  deletePTMachineC,
} from '../../controller/postgres/admin/pt_machine_admin.controller.js';

const router = express.Router();

router.get('/admin/ptmachines', getAllPTMachinesC);
router.post('/admin/ptmachines', createPTMachineAdminC);
router.put('/admin/ptmachines/:id', updatePTMachineC);
router.delete('/admin/ptmachines/:id', deletePTMachineC);

export default router;
