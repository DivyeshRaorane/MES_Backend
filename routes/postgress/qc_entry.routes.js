import express from 'express';
import { fetchBobbinQcC, checkProcessCompletionC, gradeBobbinC, submitQcEntryC, updateMissingValuesC } from '../../controller/postgres/qc_entry/qc_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/qcentry/fetch/:bobbin_no', fetchBobbinQcC);
router.get('/qcentry/process-check/:bobbin_no', checkProcessCompletionC);
router.get('/qcentry/grade/:bobbin_no', gradeBobbinC);
router.post('/qcentry/submit', authMiddleware, submitQcEntryC);
router.post('/qcentry/update-missing-values', authMiddleware, updateMissingValuesC);
router.post('/qc/update-missing-values', authMiddleware, updateMissingValuesC);

export default router;
