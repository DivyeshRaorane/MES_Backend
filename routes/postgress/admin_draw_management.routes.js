import express from 'express';
import {
    createDrawUserC, updateDrawUserC,
    getAllDrawTowersC, createDrawTowerC, updateDrawTowerC,
    getAllFiberCutReasonsC, createFiberCutReasonC, updateFiberCutReasonC,
    getAllWindingObsC, createWindingObsC, updateWindingObsC
} from '../../controller/postgres/admin/draw_management.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Draw Users
router.post('/admin/drawusers', authMiddleware, createDrawUserC);
router.put('/admin/drawusers/:draw_user_id', authMiddleware, updateDrawUserC);

// Draw Towers
router.get('/admin/drawtowers', getAllDrawTowersC);
router.post('/admin/drawtowers', authMiddleware, createDrawTowerC);
router.put('/admin/drawtowers/:tower_id', authMiddleware, updateDrawTowerC);

// Fiber Cut Reasons
router.get('/admin/fibercutreasons', getAllFiberCutReasonsC);
router.post('/admin/fibercutreasons', authMiddleware, createFiberCutReasonC);
router.put('/admin/fibercutreasons/:dfcr_id', authMiddleware, updateFiberCutReasonC);

// Winding Observations
router.get('/admin/windingobservations', getAllWindingObsC);
router.post('/admin/windingobservations', authMiddleware, createWindingObsC);
router.put('/admin/windingobservations/:wind_obs_id', authMiddleware, updateWindingObsC);

export default router;
