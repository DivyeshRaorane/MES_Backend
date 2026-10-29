import express from 'express';
import { validateColorC, submitColorC, validateRewindC, submitRewindC, fiberInformationC } from '../../controller/postgres/fg/fg.controller.js';

const router = express.Router();

router.get('/fg/color/validate/:bobbin_no', validateColorC);
router.post('/fg/color/submit', submitColorC);
router.get('/fg/rewind/validate/:bobbin_no', validateRewindC);
router.post('/fg/rewind/submit', submitRewindC);
router.get('/fg/fiber-information', fiberInformationC);

export default router;
