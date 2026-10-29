import express from 'express';
import { validateBobbinForD2C, submitD2IssueC } from '../../controller/postgres/d2_issue/d2_issue.controller.js';
import {
    createDraftC, getDraftListC, getDraftDetailsC, saveDraftBobbinC,
    removeDraftBobbinC, deleteDraftC
} from '../../controller/postgres/d2_issue/d2_issue_draft.controller.js';
import { getD2IssueBatchesC, getD2BatchGradeExportC } from '../../controller/postgres/d2_issue/d2_issue_batches.controller.js';

const router = express.Router();

router.get('/d2issue/batches', getD2IssueBatchesC);
router.get('/d2issue/batches/:d2_batch_id/grade-export', getD2BatchGradeExportC);
router.get('/d2issue/validate/:bobbin_no', validateBobbinForD2C);
router.post('/d2issue', submitD2IssueC);

// Draft Management
router.post('/d2issue/drafts/create', createDraftC);
router.get('/d2issue/drafts', getDraftListC);
router.get('/d2issue/drafts/:d2_batch_id', getDraftDetailsC);
router.post('/d2issue/drafts', saveDraftBobbinC);
router.delete('/d2issue/drafts/:d2_batch_id/bobbin/:bobbin_no', removeDraftBobbinC);
router.delete('/d2issue/drafts/:d2_batch_id', deleteDraftC);

export default router;
