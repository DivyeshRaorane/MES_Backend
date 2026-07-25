import express from 'express';
import { getGradeMandatoryC, upsertGradeMandatoryC } from '../../controller/postgres/grade_mandatory/grade_mandatory.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/grade-mandatory', authMiddleware, getGradeMandatoryC);
router.post('/admin/grade-mandatory', authMiddleware, upsertGradeMandatoryC);

export default router;
