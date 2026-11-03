import express from 'express';
import { getAllGradesC, createGradeC, updateGradeC } from '../../controller/postgres/admin/grade_admin.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/grades', getAllGradesC);
router.post('/admin/grades', requireRole("admin"), createGradeC);
router.put('/admin/grades/:qc_entry_id', requireRole("admin"), updateGradeC);

export default router;
