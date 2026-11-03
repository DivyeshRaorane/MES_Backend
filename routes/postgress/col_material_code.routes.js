import express from 'express';
import {
  createColMaterialCodeC,
  getColMaterialCodeC,
  getColMaterialCodeByIdC,
  updateColMaterialCodeC,
} from '../../controller/postgres/col_material_code/col_material_code.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// LIST
router.get("/getcolmaterialcode", getColMaterialCodeC);
router.get("/col-material-code", getColMaterialCodeC);

// VIEW (single)
router.get("/col-material-code/:col_material_code_id", getColMaterialCodeByIdC);

// CREATE (JWT is checked globally in app.js; role must be admin)
router.post("/admin/colmaterialcode", requireRole("admin"), createColMaterialCodeC);

// UPDATE / EDIT
router.put("/admin/colmaterialcode/:col_material_code_id", requireRole("admin"), updateColMaterialCodeC);

// DEPRECATED: use POST /api/admin/colmaterialcode. Remove after the frontend switches.
router.post("/createcolmaterialcode", requireRole("admin"), createColMaterialCodeC);

export default router;
