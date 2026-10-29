import express from 'express';
import { validateBobbinGradeC, getGradeListC, getGradeByIdC } from '../../controller/postgres/qc_grade/qc_grade.controller.js';

const router = express.Router();

router.get('/qcgrade/validate/:bobbin_no', validateBobbinGradeC);
router.get('/qcgrade/list', getGradeListC);
router.get('/qcgrade/:id', getGradeByIdC);

export default router;
