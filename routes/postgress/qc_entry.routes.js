import express from 'express';
import { fetchBobbinQcC, checkProcessCompletionC, gradeBobbinC, submitQcEntryC, updateMissingValuesC, mbendCopyC, mbendReassignC, ptCheckByBobbinC, flawRewindC, coloredBobbinQcC, mfdCableCutoffCalcC } from '../../controller/postgres/qc_entry/qc_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/qcentry/fetch/:bobbin_no', fetchBobbinQcC);
router.get('/qcentry/process-check/:bobbin_no', checkProcessCompletionC);
router.get('/qcentry/pt-check/:bobbin_no', authMiddleware, ptCheckByBobbinC);
router.get('/qcentry/grade/:bobbin_no', gradeBobbinC);
router.post('/qcentry/submit', authMiddleware, submitQcEntryC);
router.post('/qcentry/mbend-copy', authMiddleware, mbendCopyC);
router.post('/qcentry/mbend-reassign', authMiddleware, mbendReassignC);
router.post('/qcentry/update-missing-values', authMiddleware, updateMissingValuesC);
router.post('/qc/update-missing-values', authMiddleware, updateMissingValuesC);
router.post('/qcentry/flaw-rewind', authMiddleware, flawRewindC);
router.get('/qcentry/colored-bobbin-qc/:bobbin_no', authMiddleware, coloredBobbinQcC);
router.get('/qcentry/mfd-cable-cutoff/:bobbin_no', authMiddleware, mfdCableCutoffCalcC);

export default router;
