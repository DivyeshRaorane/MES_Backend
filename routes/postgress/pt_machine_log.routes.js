import express from 'express';
import { getByBobbinNoC } from '../../controller/postgres/pt_machine_log/pt_machine_log.controller.js';

const router = express.Router();

router.get('/ptmachinelog/:bobbin_no', getByBobbinNoC);

export default router;
