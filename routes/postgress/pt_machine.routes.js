import express from 'express';
import { createPTMachineC,getPTMachinesC } from '../../controller/postgres/pt_machine/pt_macine.controller.js';

const router = express.Router();

router.post("/createptmachines", createPTMachineC);
router.get("/getptmachines", getPTMachinesC);

export default router;