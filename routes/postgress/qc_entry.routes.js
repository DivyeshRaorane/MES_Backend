import express from 'express';
import { fetchBobbinQcC, checkProcessCompletionC, gradeBobbinC, submitQcEntryC, updateMissingValuesC, mbendCopyC, mbendReassignC, ptCheckByBobbinC, flawRewindC, coloredBobbinQcC, mfdCableCutoffCalcC } from '../../controller/postgres/qc_entry/qc_entry.controller.js';

const router = express.Router();

router.get('/qcentry/fetch/:bobbin_no', fetchBobbinQcC);
router.get('/qcentry/process-check/:bobbin_no', checkProcessCompletionC);
router.get('/qcentry/pt-check/:bobbin_no', ptCheckByBobbinC);
router.get('/qcentry/grade/:bobbin_no', gradeBobbinC);
router.post('/qcentry/submit', submitQcEntryC);
router.post('/qcentry/mbend-copy', mbendCopyC);
router.post('/qcentry/mbend-reassign', mbendReassignC);
router.post('/qcentry/update-missing-values', updateMissingValuesC);
router.post('/qc/update-missing-values', updateMissingValuesC);
router.post('/qcentry/flaw-rewind', flawRewindC);
router.get('/qcentry/colored-bobbin-qc/:bobbin_no', coloredBobbinQcC);
router.get('/qcentry/mfd-cable-cutoff/:bobbin_no', mfdCableCutoffCalcC);

export default router;

// ═══════════════════════════════════════════════════════════════════════════
// BULK QC TEMP-GRADE ROUTES (append-only — does not modify existing code)
// ═══════════════════════════════════════════════════════════════════════════
import { gradeBulkTempC, getPendingTempGradeC, getPendingFinalSubmitC, submitFinalQcC, submitFinalQcBulkC } from '../../controller/postgres/qc_entry/qc_entry.controller.js';

router.post('/qcentry/grade-bulk', gradeBulkTempC);
router.get('/qcentry/pending-temp-grade', getPendingTempGradeC);
router.get('/qcentry/pending-final-submit', getPendingFinalSubmitC);
router.post('/qcentry/submit-final', submitFinalQcC);
router.post('/qcentry/submit-final-bulk', submitFinalQcBulkC);

// ═══════════════════════════════════════════════════════════════════════════
// FINAL GRADE PROMOTION ROUTES (temp_grade -> final_grade) — append-only
// ═══════════════════════════════════════════════════════════════════════════
import { submitQcFinalGradeC, submitQcFinalGradeBulkC } from '../../controller/postgres/qc_entry/qc_final_grade.controller.js';

router.post('/qcentry/final-grade', submitQcFinalGradeC);
router.post('/qcentry/final-grade-bulk', submitQcFinalGradeBulkC);
