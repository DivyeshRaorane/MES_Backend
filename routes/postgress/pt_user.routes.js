import express from 'express';
import { createPTUsersC,getPTUsersC } from '../../controller/postgres/pt_user/pt_user.controller.js';

const router = express.Router();

router.post("/createptuser", createPTUsersC);
router.get("/getptusers",getPTUsersC);

export default router;