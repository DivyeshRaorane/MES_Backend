import express from 'express';
import { createBobbinColorC, getBobbinColorC, updateBobbinColorC } from '../../controller/postgres/bobbin_color/bobbin_color.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.get("/getbobbincolor", getBobbinColorC);
router.get("/bobbin-color", getBobbinColorC);

// Admin write routes (JWT is checked globally in app.js; role must be admin).
router.post("/admin/bobbincolors", requireRole("admin"), createBobbinColorC);
router.put("/admin/bobbincolors/:bobbin_color_id", requireRole("admin"), updateBobbinColorC);

// DEPRECATED: use POST /api/admin/bobbincolors. Remove after the frontend switches.
router.post("/createbobbincolor", requireRole("admin"), createBobbinColorC);

export default router;
