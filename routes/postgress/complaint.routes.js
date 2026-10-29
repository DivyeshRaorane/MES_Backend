import express from 'express';
import { getAllComplaintsC, getComplaintByIdC, createComplaintC, updateComplaintC } from '../../controller/postgres/complaint/complaint.controller.js';

const router = express.Router();

router.get('/complaints', getAllComplaintsC);
router.get('/complaints/:complaint_id', getComplaintByIdC);
router.post('/complaints', createComplaintC);
router.put('/complaints/:complaint_id', updateComplaintC);

export default router;
