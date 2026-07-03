import express from 'express';
import { createQcUserC, getAllQcUsersC } from '../../controller/postgres/qc_user/qc_user.controller.js';

const router = express.Router();

router.post('/createqcuser', createQcUserC);
router.get('/getqcusers', getAllQcUsersC);

export default router;
