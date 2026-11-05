import express from 'express';
import { getGradeMandatoryC, upsertGradeMandatoryC } from '../../controller/postgres/grade_mandatory/grade_mandatory.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).
router.get('/admin/grade-mandatory', getGradeMandatoryC);
router.post('/admin/grade-mandatory', requireRole("admin"), upsertGradeMandatoryC);

export default router;
