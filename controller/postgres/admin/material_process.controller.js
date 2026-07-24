import { getAllMaterialsS, createMaterialS, updateMaterialS, getAllProcessTypesS, createProcessTypeS, updateProcessTypeS, getMappingsS, createMappingS, deleteMappingS, getProcessTypesByPreformS } from "../../../services/admin/material_process.service.js";

// Material Master
export const getAllMaterialsC = async (req, res) => {
    try { res.json({ success: true, data: await getAllMaterialsS() }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const createMaterialC = async (req, res) => {
    try { res.status(201).json({ success: true, data: await createMaterialS(req.body) }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const updateMaterialC = async (req, res) => {
    try { res.json({ success: true, data: await updateMaterialS(req.params.material_code, req.body) }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Process Type
export const getAllProcessTypesC = async (req, res) => {
    try { res.json({ success: true, data: await getAllProcessTypesS() }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getProcessTypesByPreformC = async (req, res) => {
    try { res.json({ success: true, data: await getProcessTypesByPreformS(req.params.preform_type) }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const createProcessTypeC = async (req, res) => {
    try { res.status(201).json({ success: true, data: await createProcessTypeS(req.body) }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const updateProcessTypeC = async (req, res) => {
    try { res.json({ success: true, data: await updateProcessTypeS(req.params.process_type_id, req.body) }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Preform Mapping
export const getMappingsC = async (req, res) => {
    try { res.json({ success: true, data: await getMappingsS(req.params.process_type_id) }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const createMappingC = async (req, res) => {
    try { res.status(201).json({ success: true, data: await createMappingS(req.params.process_type_id, req.body) }); }
    catch (e) {
        if (e.code === '23505') return res.status(409).json({ success: false, message: "This preform type is already mapped" });
        if (e.code === 'NOT_FOUND' || e.code === 'INACTIVE') return res.status(400).json({ success: false, message: e.message });
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteMappingC = async (req, res) => {
    try { await deleteMappingS(req.params.mapping_id); res.json({ success: true, message: "Mapping removed" }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
