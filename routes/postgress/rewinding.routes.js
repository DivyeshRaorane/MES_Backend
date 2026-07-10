import express from 'express';
import { scanRewindingC, saveRewindingC } from '../../controller/postgres/rewinding/rewinding.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/rewinding/scan/:bobbin_no', scanRewindingC);
router.post('/rewinding', authMiddleware, saveRewindingC);

export default router;
