import express from 'express';
import { createDrawTimelossEntryC } from '../../controller/postgres/draw_timeloss_entry/draw_timeloss_entry.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post('/drawtimelossentry', authMiddleware, createDrawTimelossEntryC);

export default router;
