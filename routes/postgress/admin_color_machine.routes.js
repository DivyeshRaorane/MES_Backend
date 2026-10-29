import express from 'express';
import {
  getAllColorMachinesC,
  createColorMachineC,
  updateColorMachineC,
  deleteColorMachineC,
} from '../../controller/postgres/admin/color_machine_admin.controller.js';

const router = express.Router();

router.get('/admin/colormachines', getAllColorMachinesC);
router.post('/admin/colormachines', createColorMachineC);
router.put('/admin/colormachines/:id', updateColorMachineC);
router.delete('/admin/colormachines/:id', deleteColorMachineC);

export default router;
