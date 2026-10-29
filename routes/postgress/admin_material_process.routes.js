import express from 'express';
import { getAllMaterialsC, createMaterialC, updateMaterialC, getAllProcessTypesC, createProcessTypeC, updateProcessTypeC, getMappingsC, createMappingC, deleteMappingC, getProcessTypesByPreformC } from '../../controller/postgres/admin/material_process.controller.js';

const router = express.Router();

// Material Master
router.get('/admin/materials', getAllMaterialsC);
router.post('/admin/materials', createMaterialC);
router.put('/admin/materials/:material_code', updateMaterialC);

// Process Type
router.get('/admin/process-types', getAllProcessTypesC);
router.get('/admin/process-types/by-preform/:preform_type', getProcessTypesByPreformC);
router.post('/admin/process-types', createProcessTypeC);
router.put('/admin/process-types/:process_type_id', updateProcessTypeC);

// Preform Mapping
router.get('/admin/process-types/:process_type_id/mappings', getMappingsC);
router.post('/admin/process-types/:process_type_id/mappings', createMappingC);
router.delete('/admin/process-types/mappings/:mapping_id', deleteMappingC);

export default router;
