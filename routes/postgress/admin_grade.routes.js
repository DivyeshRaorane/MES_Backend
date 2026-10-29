import express from 'express';
import { getAllGradesC, createGradeC, updateGradeC } from '../../controller/postgres/admin/grade_admin.controller.js';

const router = express.Router();

router.get('/admin/grades', getAllGradesC);
router.post('/admin/grades', createGradeC);
router.put('/admin/grades/:qc_entry_id', updateGradeC);

export default router;
