import express from 'express';
import { getTraysC, getPositionsC, assignC, removeC, searchC } from '../../controller/postgres/modula/modula.controller.js';

const router = express.Router();

router.get('/modula/trays', getTraysC);
router.get('/modula/trays/:tray_id/positions', getPositionsC);
router.put('/modula/assign', assignC);
router.put('/modula/remove', removeC);
router.get('/modula/search/:bobbin_no', searchC);

export default router;
