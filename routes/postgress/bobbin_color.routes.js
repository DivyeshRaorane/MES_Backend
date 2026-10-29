import express from 'express';
import { createBobbinColorC, getBobbinColorC, updateBobbinColorC } from '../../controller/postgres/bobbin_color/bobbin_color.controller.js';

const router = express.Router();

router.post("/createbobbincolor", createBobbinColorC);
router.get("/getbobbincolor", getBobbinColorC);
router.get("/bobbin-color", getBobbinColorC);
router.put("/admin/bobbincolors/:bobbin_color_id", updateBobbinColorC);

export default router;
