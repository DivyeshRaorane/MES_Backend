import express from 'express';
import { getAllTraysC, createTrayC, deactivateTrayC, activateTrayC, updateTrayNameC, getPositionsC, addPositionsC, removePositionsC } from '../../controller/postgres/admin/tray_admin.controller.js';

const router = express.Router();

router.get('/admin/trays', getAllTraysC);
router.post('/admin/trays', createTrayC);
router.put('/admin/trays/:tray_id/deactivate', deactivateTrayC);
router.put('/admin/trays/:tray_id/activate', activateTrayC);
router.put('/admin/trays/:tray_id/update-name', updateTrayNameC);
router.get('/admin/trays/:tray_id/positions', getPositionsC);
router.put('/admin/trays/:tray_id/add-positions', addPositionsC);
router.put('/admin/trays/:tray_id/remove-positions', removePositionsC);

export default router;
