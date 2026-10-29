import express from 'express';
import { getStackLabelsC } from '../../controller/postgres/stack_label/stack_label.controller.js';

const router = express.Router();

// POST /api/stack/labels — consignee address data for one or more bobbins
router.post('/stack/labels', getStackLabelsC);

export default router;
