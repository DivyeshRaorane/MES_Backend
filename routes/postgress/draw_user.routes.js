import express from 'express';
import { createDrawUserC,getAllDrawUsersC } from '../../controller/postgres/draw_user/draw_user.controller.js';

const router = express.Router();

router.post('/createdrawuser',createDrawUserC);
router.get('/getdrawusers', getAllDrawUsersC);

export default router;