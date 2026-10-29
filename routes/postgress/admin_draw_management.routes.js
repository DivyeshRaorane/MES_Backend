import express from 'express';
import {
    createDrawUserC, updateDrawUserC,
    getAllDrawTowersC, createDrawTowerC, updateDrawTowerC,
    getAllFiberCutReasonsC, createFiberCutReasonC, updateFiberCutReasonC,
    getAllWindingObsC, createWindingObsC, updateWindingObsC
} from '../../controller/postgres/admin/draw_management.controller.js';

const router = express.Router();

// Draw Users
router.post('/admin/drawusers', createDrawUserC);
router.put('/admin/drawusers/:draw_user_id', updateDrawUserC);

// Draw Towers
router.get('/admin/drawtowers', getAllDrawTowersC);
router.post('/admin/drawtowers', createDrawTowerC);
router.put('/admin/drawtowers/:tower_id', updateDrawTowerC);

// Fiber Cut Reasons
router.get('/admin/fibercutreasons', getAllFiberCutReasonsC);
router.post('/admin/fibercutreasons', createFiberCutReasonC);
router.put('/admin/fibercutreasons/:dfcr_id', updateFiberCutReasonC);

// Winding Observations
router.get('/admin/windingobservations', getAllWindingObsC);
router.post('/admin/windingobservations', createWindingObsC);
router.put('/admin/windingobservations/:wind_obs_id', updateWindingObsC);

export default router;
