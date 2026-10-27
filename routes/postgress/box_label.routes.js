import express from 'express';
import { getBoxLabelsC } from '../../controller/postgres/box_label/box_label.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// POST /api/box/labels — label data for one or more boxes
router.post('/box/labels', authMiddleware, getBoxLabelsC);

export default router;
