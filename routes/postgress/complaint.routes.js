import express from 'express';
import { getAllComplaintsC, getComplaintByIdC, createComplaintC, updateComplaintC } from '../../controller/postgres/complaint/complaint.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get('/complaints', getAllComplaintsC);
router.get('/complaints/:complaint_id', getComplaintByIdC);
router.post('/complaints', authMiddleware, createComplaintC);
router.put('/complaints/:complaint_id', authMiddleware, updateComplaintC);

export default router;
