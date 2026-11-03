import express from 'express';
import {
  getAllColorMachinesC,
  createColorMachineC,
  updateColorMachineC,
  deleteColorMachineC,
} from '../../controller/postgres/admin/color_machine_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/colormachines', getAllColorMachinesC);
router.post('/admin/colormachines', requireRole("admin"), createColorMachineC);
router.put('/admin/colormachines/:id', requireRole("admin"), updateColorMachineC);
router.delete('/admin/colormachines/:id', requireRole("admin"), deleteColorMachineC);

export default router;
