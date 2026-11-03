import express from 'express';
import {
    createDrawUserC, updateDrawUserC,
    getAllDrawTowersC, createDrawTowerC, updateDrawTowerC,
    getAllFiberCutReasonsC, createFiberCutReasonC, updateFiberCutReasonC,
    getAllWindingObsC, createWindingObsC, updateWindingObsC
} from '../../controller/postgres/admin/draw_management.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).

// Draw Users
router.post('/admin/drawusers', requireRole("admin"), createDrawUserC);
router.put('/admin/drawusers/:draw_user_id', requireRole("admin"), updateDrawUserC);

// Draw Towers
router.get('/admin/drawtowers', getAllDrawTowersC);
router.post('/admin/drawtowers', requireRole("admin"), createDrawTowerC);
router.put('/admin/drawtowers/:tower_id', requireRole("admin"), updateDrawTowerC);

// Fiber Cut Reasons
router.get('/admin/fibercutreasons', getAllFiberCutReasonsC);
router.post('/admin/fibercutreasons', requireRole("admin"), createFiberCutReasonC);
router.put('/admin/fibercutreasons/:dfcr_id', requireRole("admin"), updateFiberCutReasonC);

// Winding Observations
router.get('/admin/windingobservations', getAllWindingObsC);
router.post('/admin/windingobservations', requireRole("admin"), createWindingObsC);
router.put('/admin/windingobservations/:wind_obs_id', requireRole("admin"), updateWindingObsC);

export default router;
