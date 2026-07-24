import express from 'express';
import { getAllMaterialsC, createMaterialC, updateMaterialC, getAllProcessTypesC, createProcessTypeC, updateProcessTypeC, getMappingsC, createMappingC, deleteMappingC, getProcessTypesByPreformC } from '../../controller/postgres/admin/material_process.controller.js';
import { authMiddleware } from '../../middleware/aut_middleware.js';

const router = express.Router();

// Material Master
router.get('/admin/materials', authMiddleware, getAllMaterialsC);
router.post('/admin/materials', authMiddleware, createMaterialC);
router.put('/admin/materials/:material_code', authMiddleware, updateMaterialC);

// Process Type
router.get('/admin/process-types', authMiddleware, getAllProcessTypesC);
router.get('/admin/process-types/by-preform/:preform_type', authMiddleware, getProcessTypesByPreformC);
router.post('/admin/process-types', authMiddleware, createProcessTypeC);
router.put('/admin/process-types/:process_type_id', authMiddleware, updateProcessTypeC);

// Preform Mapping
router.get('/admin/process-types/:process_type_id/mappings', authMiddleware, getMappingsC);
router.post('/admin/process-types/:process_type_id/mappings', authMiddleware, createMappingC);
router.delete('/admin/process-types/mappings/:mapping_id', authMiddleware, deleteMappingC);

export default router;
