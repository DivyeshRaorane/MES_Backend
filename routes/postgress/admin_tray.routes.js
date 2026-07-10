import express from 'express';
import { getAllTraysC, createTrayC, deactivateTrayC, getPositionsC, addPositionsC, removePositionsC } from '../../controller/postgres/admin/tray_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/trays', getAllTraysC);
router.post('/admin/trays', authMiddleware, createTrayC);
router.put('/admin/trays/:tray_id/deactivate', authMiddleware, deactivateTrayC);
router.get('/admin/trays/:tray_id/positions', getPositionsC);
router.put('/admin/trays/:tray_id/add-positions', authMiddleware, addPositionsC);
router.put('/admin/trays/:tray_id/remove-positions', authMiddleware, removePositionsC);

export default router;
