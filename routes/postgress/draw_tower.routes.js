import express from 'express';
import { createTowerC,getTowerC } from '../../controller/postgres/draw_tower/draw_tower.controller.js';

const router = express.Router();

router.post('/createtower', createTowerC);
router.get('/gettowers', getTowerC)

export default router;
