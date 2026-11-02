import express from 'express';
import { lockFiberC, unlockFiberC } from '../../controller/postgres/fiber_lock/fiber_lock.controller.js';

const router = express.Router();

// POST /api/fiber/lock — lock a preform / spool / bobbin and everything under it
router.post('/fiber/lock', lockFiberC);

// POST /api/fiber/unlock — unlock a preform / spool / bobbin and everything under it
router.post('/fiber/unlock', unlockFiberC);

export default router;
