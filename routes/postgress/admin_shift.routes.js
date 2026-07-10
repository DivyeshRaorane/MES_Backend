import express from 'express';
import { createShiftC, updateShiftC } from '../../controller/postgres/admin/shift_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post('/admin/shifts', authMiddleware, createShiftC);
router.put('/admin/shifts/:shift_id', authMiddleware, updateShiftC);

export default router;
