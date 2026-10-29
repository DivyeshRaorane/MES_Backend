import express from 'express';
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
    getSectionsC,
    getCompatibleFunctionsC
} from '../../controller/postgres/function_reports/function_reports.controller.js';

const router = express.Router();

// ─── Discovery (READ-ONLY from pg_proc) ─────────────────────────────────────
router.get('/available-functions', getAvailableFunctionsC);
router.get('/function-params/:schemaName/:functionName', getFunctionParamsC);
router.get('/compatible-functions', getCompatibleFunctionsC);

// ─── Sections ────────────────────────────────────────────────────────────────
router.get('/sections', getSectionsC);

// ─── User-facing reports ─────────────────────────────────────────────────────
router.get('/user/reports', getUserReportsC);

// ─── Execution & Export ──────────────────────────────────────────────────────
router.post('/:id/execute', executeReportC);
router.post('/:id/export/excel', exportExcelC);
router.post('/:id/export/csv', exportCsvC);

// ─── Admin CRUD ──────────────────────────────────────────────────────────────
router.get('/', getAllReportsC);
router.post('/', createReportC);
router.get('/:id', getReportByIdC);
router.put('/:id', updateReportC);
router.patch('/:id/toggle-status', toggleReportStatusC);
router.delete('/:id', deleteReportC);

export default router;
