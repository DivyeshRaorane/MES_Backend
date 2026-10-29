import express from 'express';
import { createShiftC, updateShiftC } from '../../controller/postgres/admin/shift_admin.controller.js';

const router = express.Router();

router.post('/admin/shifts', createShiftC);
router.put('/admin/shifts/:shift_id', updateShiftC);

export default router;
