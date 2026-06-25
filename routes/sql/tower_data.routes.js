import express from 'express';
import { fetchTowerAllEventsC } from '../../controller/sql/tower_data.controller.js';

const router = express.Router();

router.post('/towerdata', fetchTowerAllEventsC);

export default router;