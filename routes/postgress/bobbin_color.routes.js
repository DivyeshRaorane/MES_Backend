import express from 'express';
import { createBobbinColorC, getBobbinColorC, updateBobbinColorC } from '../../controller/postgres/bobbin_color/bobbin_color.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

router.post("/createbobbincolor", createBobbinColorC);
router.get("/getbobbincolor", getBobbinColorC);
router.put("/admin/bobbincolors/:bobbin_color_id", authMiddleware, updateBobbinColorC);

export default router;
