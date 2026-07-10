import express from 'express';
import { validateQcOutC, submitQcOutC } from '../../controller/postgres/qc_out/qc_out.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/qcout/validate/:bobbin_no', validateQcOutC);
router.post('/qcout/submit', authMiddleware, submitQcOutC);

export default router;
