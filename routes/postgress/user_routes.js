import express from 'express';
import { register_user,login } from '../../controller/postgres/user/user_controller.js';

const router = express.Router();

router.post('/reguser', register_user);
router.post('/login', login);

export default router;
