import express from 'express';
import { scanRewindingC, saveRewindingC } from '../../controller/postgres/rewinding/rewinding.controller.js';

const router = express.Router();

router.get('/rewinding/scan/:bobbin_no', scanRewindingC);
router.post('/rewinding', saveRewindingC);

export default router;
