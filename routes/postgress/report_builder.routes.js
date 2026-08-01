import express from 'express';
import { authMiddleware } from '../../middleware/aut_middleware.js';
import {
    getTablesC, getTableColumnsC, getTableRelationshipsC,
    getAllReportsC, getReportByIdC, createReportC, updateReportC, deleteReportC, duplicateReportC,
    previewReportC, generateSqlC, executeReportC, previewTableC,
    getReportPermissionsC, updateReportPermissionsC, getRolesC, getUsersC
} from '../../controller/postgres/report_builder/report_builder.controller.js';

const router = express.Router();

// Database Discovery
router.get('/tables', authMiddleware, getTablesC);
router.get('/tables/:tableName/columns', authMiddleware, getTableColumnsC);
router.get('/tables/:tableName/relationships', authMiddleware, getTableRelationshipsC);

// Roles & Users (for permissions UI)
router.get('/roles', authMiddleware, getRolesC);
router.get('/users', authMiddleware, getUsersC);

// Preview & SQL Generation (MUST be before /reports/:id to avoid :id matching "preview"/"sql")
router.post('/reports/preview', authMiddleware, previewReportC);
router.post('/reports/sql', authMiddleware, generateSqlC);
router.post('/reports/preview-table', authMiddleware, previewTableC);

// Report CRUD
router.get('/reports', authMiddleware, getAllReportsC);
router.post('/reports', authMiddleware, createReportC);
router.get('/reports/:id', authMiddleware, getReportByIdC);
router.put('/reports/:id', authMiddleware, updateReportC);
router.delete('/reports/:id', authMiddleware, deleteReportC);
router.post('/reports/:id/duplicate', authMiddleware, duplicateReportC);
router.post('/reports/:id/execute', authMiddleware, executeReportC);

// Permissions
router.get('/reports/:id/permissions', authMiddleware, getReportPermissionsC);
router.put('/reports/:id/permissions', authMiddleware, updateReportPermissionsC);

export default router;
