import express from 'express';
import {
    getChambersInUseC, getBatchesForIssueC, validateBobbinC,
    issueH2C, getPendingBeforeC, getPendingAfterC, getPending14DayC,
    getBobbinsForBatchC, saveBeforeEntryC, saveAfterEntryC, save14DayEntryC
} from '../../controller/postgres/h2_ageing/h2_ageing.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/h2ageing/chambers-in-use', getChambersInUseC);
router.get('/h2ageing/batches-for-issue', getBatchesForIssueC);
router.get('/h2ageing/validate-bobbin/:bobbin_no', validateBobbinC);
router.post('/h2ageing/issue', authMiddleware, issueH2C);
router.get('/h2ageing/pending-before', getPendingBeforeC);
router.get('/h2ageing/pending-after', getPendingAfterC);
router.get('/h2ageing/pending-14day', getPending14DayC);
router.get('/h2ageing/bobbins/:h2_batch_id', getBobbinsForBatchC);
router.put('/h2ageing/before-entry', authMiddleware, saveBeforeEntryC);
router.put('/h2ageing/after-entry', authMiddleware, saveAfterEntryC);
router.put('/h2ageing/14day-entry', authMiddleware, save14DayEntryC);

export default router;
