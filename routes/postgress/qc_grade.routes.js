import express from 'express';
import { validateBobbinGradeC, getGradeListC, getGradeByIdC } from '../../controller/postgres/qc_grade/qc_grade.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/qcgrade/validate/:bobbin_no', validateBobbinGradeC);
router.get('/qcgrade/list', authMiddleware, getGradeListC);
router.get('/qcgrade/:id', authMiddleware, getGradeByIdC);

export default router;
