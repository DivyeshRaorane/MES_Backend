import express from 'express';
import { getAllFgUsersC } from '../../controller/postgres/fg_user/fg_user.controller.js';

const router = express.Router();

// Any logged-in user (JWT is checked globally in app.js).
router.get('/getfgusers', getAllFgUsersC);

export default router;
