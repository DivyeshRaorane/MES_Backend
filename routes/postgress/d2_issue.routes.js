import express from 'express';
import { validateBobbinForD2C, submitD2IssueC } from '../../controller/postgres/d2_issue/d2_issue.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/d2issue/validate/:bobbin_no', authMiddleware, validateBobbinForD2C);
router.post('/d2issue', authMiddleware, submitD2IssueC);

export default router;
