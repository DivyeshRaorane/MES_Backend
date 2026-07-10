import express from 'express';
import { getTraysC, getPositionsC, assignC, removeC, searchC } from '../../controller/postgres/modula/modula.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/modula/trays', getTraysC);
router.get('/modula/trays/:tray_id/positions', getPositionsC);
router.put('/modula/assign', authMiddleware, assignC);
router.put('/modula/remove', authMiddleware, removeC);
router.get('/modula/search/:bobbin_no', searchC);

export default router;
