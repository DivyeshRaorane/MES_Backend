import express from 'express';
import { createWindingObsC,getAllWindingObsC } from '../../controller/postgres/winding_observation/winding_observation.controller.js';

const router = express.Router();

router.post("/createwindingobservation", createWindingObsC);
router.get("/getallwindingobservation",getAllWindingObsC);

export default router