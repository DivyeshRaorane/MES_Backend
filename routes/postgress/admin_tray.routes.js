import express from 'express';
import { getAllTraysC, createTrayC, deactivateTrayC, activateTrayC, updateTrayNameC, getPositionsC, addPositionsC, removePositionsC } from '../../controller/postgres/admin/tray_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/trays', getAllTraysC);
router.post('/admin/trays', requireRole("admin"), createTrayC);
router.put('/admin/trays/:tray_id/deactivate', requireRole("admin"), deactivateTrayC);
router.put('/admin/trays/:tray_id/activate', requireRole("admin"), activateTrayC);
router.put('/admin/trays/:tray_id/update-name', requireRole("admin"), updateTrayNameC);
router.get('/admin/trays/:tray_id/positions', getPositionsC);
router.put('/admin/trays/:tray_id/add-positions', requireRole("admin"), addPositionsC);
router.put('/admin/trays/:tray_id/remove-positions', requireRole("admin"), removePositionsC);

export default router;
