import express from 'express';
import { createBobbinColorC,getBobbinColorC } from '../../controller/postgres/bobbin_color/bobbin_color.controller.js';

const router = express.Router();

router.post("/createbobbincolor", createBobbinColorC);
router.get("/getbobbincolor", getBobbinColorC);

export default router;