import express from 'express';
import { addDepartment } from '../../controller/postgres/department/department_controller.js';

const router = express.Router();

router.post('/adddept', addDepartment);

export default router;