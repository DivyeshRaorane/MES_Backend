import express from 'express';
import {
  getAllRewMachinesC,
  createRewMachineC,
  updateRewMachineC,
  deleteRewMachineC,
} from '../../controller/postgres/admin/rew_machine_admin.controller.js';

const router = express.Router();

router.get('/admin/rewmachines', getAllRewMachinesC);
router.post('/admin/rewmachines', createRewMachineC);
router.put('/admin/rewmachines/:id', updateRewMachineC);
router.delete('/admin/rewmachines/:id', deleteRewMachineC);

export default router;
