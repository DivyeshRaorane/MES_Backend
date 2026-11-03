import express from 'express';
import { getAllMaterialsC, createMaterialC, updateMaterialC, getAllProcessTypesC, createProcessTypeC, updateProcessTypeC, getMappingsC, createMappingC, deleteMappingC, getProcessTypesByPreformC } from '../../controller/postgres/admin/material_process.controller.js';
import { requireRole } from '../../middleware/aut_middleware.js';

const router = express.Router();

// GET: any logged-in user. Writes: admin role (JWT is checked globally in app.js).

// Material Master
router.get('/admin/materials', getAllMaterialsC);
router.post('/admin/materials', requireRole("admin"), createMaterialC);
router.put('/admin/materials/:material_code', requireRole("admin"), updateMaterialC);

// Process Type
router.get('/admin/process-types', getAllProcessTypesC);
router.get('/admin/process-types/by-preform/:preform_type', getProcessTypesByPreformC);
router.post('/admin/process-types', requireRole("admin"), createProcessTypeC);
router.put('/admin/process-types/:process_type_id', requireRole("admin"), updateProcessTypeC);

// Preform Mapping
router.get('/admin/process-types/:process_type_id/mappings', getMappingsC);
router.post('/admin/process-types/:process_type_id/mappings', requireRole("admin"), createMappingC);
router.delete('/admin/process-types/mappings/:mapping_id', requireRole("admin"), deleteMappingC);

export default router;
