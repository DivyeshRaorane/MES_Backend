import express from 'express';
import { lockFiberC, unlockFiberC } from '../../controller/postgres/fiber_lock/fiber_lock.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// JWT is checked globally in app.js; role must be admin.

// POST /api/admin/fiber/lock — lock a preform / spool / bobbin and everything under it
router.post('/admin/fiber/lock', requireRole("admin"), lockFiberC);

// POST /api/admin/fiber/unlock — unlock a preform / spool / bobbin and everything under it
router.post('/admin/fiber/unlock', requireRole("admin"), unlockFiberC);

// DEPRECATED: use /api/admin/fiber/lock and /api/admin/fiber/unlock. Remove after the frontend switches.
router.post('/fiber/lock', requireRole("admin"), lockFiberC);
router.post('/fiber/unlock', requireRole("admin"), unlockFiberC);

export default router;
