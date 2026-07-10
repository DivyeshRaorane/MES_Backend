import express from 'express';
import { validateBobbinGradeC } from '../../controller/postgres/qc_grade/qc_grade.controller.js';

const router = express.Router();

router.get('/qcgrade/validate/:bobbin_no', validateBobbinGradeC);

export default router;
