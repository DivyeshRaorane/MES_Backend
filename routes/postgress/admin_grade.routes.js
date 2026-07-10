import express from 'express';
import { getAllGradesC, createGradeC, updateGradeC } from '../../controller/postgres/admin/grade_admin.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/admin/grades', authMiddleware, getAllGradesC);
router.post('/admin/grades', authMiddleware, createGradeC);
router.put('/admin/grades/:qc_entry_id', authMiddleware, updateGradeC);

export default router;
