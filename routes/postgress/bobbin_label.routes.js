import express from 'express';
import { getBobbinLabelsC } from '../../controller/postgres/bobbin_label/bobbin_label.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// POST /api/bobbin/labels — label/sticker data for a batch of bobbins
router.post('/bobbin/labels', authMiddleware, getBobbinLabelsC);

export default router;
