import express from 'express';
import { getGradeMandatoryC, upsertGradeMandatoryC } from '../../controller/postgres/grade_mandatory/grade_mandatory.controller.js';

const router = express.Router();

router.get('/admin/grade-mandatory', getGradeMandatoryC);
router.post('/admin/grade-mandatory', upsertGradeMandatoryC);

export default router;
