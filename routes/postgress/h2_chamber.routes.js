import express from 'express';
import { createH2ChamberC, getH2ChambersC } from '../../controller/postgres/h2_chamber/h2_chamber.controller.js';

const router = express.Router();

router.post('/createh2chamber', createH2ChamberC);
router.get('/geth2chambers', getH2ChambersC);

export default router;
