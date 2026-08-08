import express from 'express';
import { getAllConfigsC, createConfigC, updateConfigC, toggleConfigStatusC } from '../../controller/postgres/admin/mes_config.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/mes-config', authMiddleware, getAllConfigsC);
router.post('/admin/mes-config', authMiddleware, createConfigC);
router.put('/admin/mes-config/:id', authMiddleware, updateConfigC);
router.patch('/admin/mes-config/:id/status', authMiddleware, toggleConfigStatusC);

export default router;
