import express from 'express';
import { scanColouringC, saveColouringC, getJobCardsC, getJobCardBobbinsC } from '../../controller/postgres/colouring/colouring.controller.js';

const router = express.Router();

router.get('/colouring/scan/:bobbin_no', scanColouringC);
router.post('/colouring', saveColouringC);
router.get('/colouring/jobcards', getJobCardsC);
router.get('/colouring/jobcards/:col_jcard_no/bobbins', getJobCardBobbinsC);

export default router;
