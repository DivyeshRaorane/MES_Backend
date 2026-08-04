import express from 'express';
import { validateColorC, submitColorC, validateRewindC, submitRewindC, fiberInformationC } from '../../controller/postgres/fg/fg.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/fg/color/validate/:bobbin_no', validateColorC);
router.post('/fg/color/submit', authMiddleware, submitColorC);
router.get('/fg/rewind/validate/:bobbin_no', validateRewindC);
router.post('/fg/rewind/submit', authMiddleware, submitRewindC);
router.get('/fg/fiber-information', authMiddleware, fiberInformationC);

export default router;
