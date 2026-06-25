import express from 'express';
import { register_user,login, getUsersC } from '../../controller/postgres/user/user_controller.js';

const router = express.Router();

router.post('/reguser', register_user);
router.post('/login', login);
router.get('/getuser', getUsersC)

export default router;
