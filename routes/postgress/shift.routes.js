import express from 'express';
import { createShiftC,getAllShiftsC } from '../../controller/postgres/shift/shift.controller.js';

const router = express.Router();

router.post('/createshift', createShiftC);
router.get('/getshifts', getAllShiftsC);

export default router;