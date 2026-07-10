import express from 'express';
import { createD2ChamberC, getAllD2ChambersC } from '../../controller/postgres/d2_chamber/d2_chamber.controller.js';

const router = express.Router();

router.post('/created2chamber', createD2ChamberC);
router.get('/getd2chambers', getAllD2ChambersC);

export default router;
