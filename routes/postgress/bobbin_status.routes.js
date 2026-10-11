import express from 'express';
import { getBobbinStatusC } from '../../controller/postgres/bobbin_status/bobbin_status.controller.js';

const router = express.Router();

router.get('/bobbin-status/:bobbin_no', getBobbinStatusC);

export default router;
