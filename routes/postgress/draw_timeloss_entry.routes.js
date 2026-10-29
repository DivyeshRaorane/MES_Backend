import express from 'express';
import { createDrawTimelossEntryC } from '../../controller/postgres/draw_timeloss_entry/draw_timeloss_entry.controller.js';

const router = express.Router();

router.post('/drawtimelossentry', createDrawTimelossEntryC);

export default router;
