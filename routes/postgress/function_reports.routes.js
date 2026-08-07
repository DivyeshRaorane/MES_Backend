import express from 'express';
import { authMiddleware } from '../../middleware/aut_middleware.js';
import {
    getAvailableFunctionsC,
    getFunctionParamsC,
    getAllReportsC,
    getReportByIdC,
    createReportC,
    updateReportC,
    toggleReportStatusC,
    deleteReportC,
    getUserReportsC,
    executeReportC,
    exportExcelC,
    exportCsvC,
    getSectionsC
} from '../../controller/postgres/function_reports/function_reports.controller.js';

const router = express.Router();

// ─── Discovery (READ-ONLY from pg_proc) ─────────────────────────────────────
router.get('/available-functions', authMiddleware, getAvailableFunctionsC);
router.get('/function-params/:schemaName/:functionName', authMiddleware, getFunctionParamsC);

// ─── Sections ────────────────────────────────────────────────────────────────
router.get('/sections', authMiddleware, getSectionsC);

// ─── User-facing reports ─────────────────────────────────────────────────────
router.get('/user/reports', authMiddleware, getUserReportsC);

// ─── Execution & Export ──────────────────────────────────────────────────────
router.post('/:id/execute', authMiddleware, executeReportC);
router.post('/:id/export/excel', authMiddleware, exportExcelC);
router.post('/:id/export/csv', authMiddleware, exportCsvC);

// ─── Admin CRUD ──────────────────────────────────────────────────────────────
router.get('/', authMiddleware, getAllReportsC);
router.post('/', authMiddleware, createReportC);
router.get('/:id', authMiddleware, getReportByIdC);
router.put('/:id', authMiddleware, updateReportC);
router.patch('/:id/toggle-status', authMiddleware, toggleReportStatusC);
router.delete('/:id', authMiddleware, deleteReportC);

export default router;
