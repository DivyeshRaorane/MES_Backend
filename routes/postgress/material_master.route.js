import express from 'express';
import { createMaterialMasterC,getMaterialMasterC } from "../../controller/postgres/material_master/material_master.controller.js";

const router = express.Router();

router.post('/creatematerialmaster', createMaterialMasterC);
router.get('/getmaterialmaster', getMaterialMasterC )

export default router;