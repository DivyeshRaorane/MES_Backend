import express from 'express';
import { getPreformForHandleJoin,handleJoinC } from '../../controller/postgres/handle_join/handle_join.controller.js';

const router = express.Router();

router.get('/getpreformformhandlejoin',getPreformForHandleJoin);
router.post('/handlejoin', handleJoinC)

export default router;