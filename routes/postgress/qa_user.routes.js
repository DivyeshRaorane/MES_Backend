import express from 'express';
import { getAllQaUsersC } from '../../controller/postgres/qa_user/qa_user.controller.js';

const router = express.Router();

// Any logged-in user (JWT is checked globally in app.js).
router.get('/getqausers', getAllQaUsersC);

export default router;
