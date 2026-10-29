import express from 'express';
import {
    getTablesC, getTableColumnsC, getTableRelationshipsC,
    getAllReportsC, getReportByIdC, createReportC, updateReportC, deleteReportC, duplicateReportC,
    previewReportC, generateSqlC, executeReportC, previewTableC,
    getReportPermissionsC, updateReportPermissionsC, getRolesC, getUsersC
} from '../../controller/postgres/report_builder/report_builder.controller.js';

const router = express.Router();

// Database Discovery
router.get('/tables', getTablesC);
router.get('/tables/:tableName/columns', getTableColumnsC);
router.get('/tables/:tableName/relationships', getTableRelationshipsC);

// Roles & Users (for permissions UI)
router.get('/roles', getRolesC);
router.get('/users', getUsersC);

// Preview & SQL Generation (MUST be before /reports/:id to avoid :id matching "preview"/"sql")
router.post('/reports/preview', previewReportC);
router.post('/reports/sql', generateSqlC);
router.post('/reports/preview-table', previewTableC);

// Report CRUD
router.get('/reports', getAllReportsC);
router.post('/reports', createReportC);
router.get('/reports/:id', getReportByIdC);
router.put('/reports/:id', updateReportC);
router.delete('/reports/:id', deleteReportC);
router.post('/reports/:id/duplicate', duplicateReportC);
router.post('/reports/:id/execute', executeReportC);

// Permissions
router.get('/reports/:id/permissions', getReportPermissionsC);
router.put('/reports/:id/permissions', updateReportPermissionsC);

export default router;
