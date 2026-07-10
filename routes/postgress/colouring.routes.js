import express from 'express';
import { scanColouringC, saveColouringC } from '../../controller/postgres/colouring/colouring.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/colouring/scan/:bobbin_no', scanColouringC);
router.post('/colouring', authMiddleware, saveColouringC);

export default router;
