import express from 'express';
import {
  getAllColorMachinesC,
  createColorMachineC,
  updateColorMachineC,
  deleteColorMachineC,
} from '../../controller/postgres/admin/color_machine_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/colormachines', getAllColorMachinesC);
router.post('/admin/colormachines', authMiddleware, createColorMachineC);
router.put('/admin/colormachines/:id', authMiddleware, updateColorMachineC);
router.delete('/admin/colormachines/:id', authMiddleware, deleteColorMachineC);

export default router;
