import express from 'express';
import { getAllConfigsC, createConfigC, updateConfigC, toggleConfigStatusC } from '../../controller/postgres/admin/mes_config.controller.js';

const router = express.Router();

router.get('/admin/mes-config', getAllConfigsC);
router.post('/admin/mes-config', createConfigC);
router.put('/admin/mes-config/:id', updateConfigC);
router.patch('/admin/mes-config/:id/status', toggleConfigStatusC);

export default router;
