import express from 'express';
import { validateBobbinForD2C, submitD2IssueC } from '../../controller/postgres/d2_issue/d2_issue.controller.js';
import {
    getDraftListC, getDraftDetailsC, saveDraftBobbinC,
    removeDraftBobbinC, deleteDraftC
} from '../../controller/postgres/d2_issue/d2_issue_draft.controller.js';
import { getD2IssueBatchesC, getD2BatchGradeExportC } from '../../controller/postgres/d2_issue/d2_issue_batches.controller.js';
import { d2FinalGradeSingleC, d2FinalGradeBulkC } from '../../controller/postgres/d2_issue/d2_final_grade.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/d2issue/batches', getD2IssueBatchesC);
router.get('/d2issue/batches/:d2_batch_id/grade-export', getD2BatchGradeExportC);
router.get('/d2issue/validate/:bobbin_no', authMiddleware, validateBobbinForD2C);
router.post('/d2issue', authMiddleware, submitD2IssueC);

// Final Grade
router.post('/d2issue/final-grade/single', d2FinalGradeSingleC);
router.post('/d2issue/final-grade/bulk', d2FinalGradeBulkC);

// Draft Management
router.get('/d2issue/drafts', authMiddleware, getDraftListC);
router.get('/d2issue/drafts/:d2_batch_id', authMiddleware, getDraftDetailsC);
router.post('/d2issue/drafts', authMiddleware, saveDraftBobbinC);
router.delete('/d2issue/drafts/:d2_batch_id/bobbin/:bobbin_no', authMiddleware, removeDraftBobbinC);
router.delete('/d2issue/drafts/:d2_batch_id', authMiddleware, deleteDraftC);

export default router;
