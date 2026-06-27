import express from 'express';
import { createBobbinTypeC, getBobbinTypeC } from '../../controller/postgres/bobbin_type/bobbin_type.controller.js';

const router = express.Router();

router.post("/createbobbintype", createBobbinTypeC);
router.get("/getbobbintype", getBobbinTypeC);

export default router;