import express from 'express';
import {
  createColMaterialCodeC,
  getColMaterialCodeC,
  getColMaterialCodeByIdC,
  updateColMaterialCodeC,
} from '../../controller/postgres/col_material_code/col_material_code.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// CREATE
router.post("/createcolmaterialcode", createColMaterialCodeC);

// LIST
router.get("/getcolmaterialcode", getColMaterialCodeC);
router.get("/col-material-code", getColMaterialCodeC);

// VIEW (single)
router.get("/col-material-code/:col_material_code_id", getColMaterialCodeByIdC);

// UPDATE / EDIT
router.put("/admin/colmaterialcode/:col_material_code_id", authMiddleware, updateColMaterialCodeC);

export default router;
