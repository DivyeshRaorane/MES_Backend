import express from 'express';
import { getPendingQcOutC, bulkValidateQcOutC, bulkSubmitQcOutC, validateQcOutC, submitQcOutC } from '../../controller/postgres/qc_out/qc_out.controller.js';

const router = express.Router();

router.get('/qcout/pending', getPendingQcOutC);
router.post('/qcout/bulk-validate', bulkValidateQcOutC);
router.post('/qcout/bulk-submit', bulkSubmitQcOutC);
router.get('/qcout/validate/:bobbin_no', validateQcOutC);
router.post('/qcout/submit', submitQcOutC);

export default router;
