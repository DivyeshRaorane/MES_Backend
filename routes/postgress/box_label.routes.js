import express from 'express';
import { getBoxLabelsC } from '../../controller/postgres/box_label/box_label.controller.js';

const router = express.Router();

// POST /api/box/labels — label data for one or more boxes
router.post('/box/labels', getBoxLabelsC);

export default router;
