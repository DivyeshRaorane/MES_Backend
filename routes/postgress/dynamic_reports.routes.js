import express from 'express';
import { authMiddleware } from '../../middleware/aut_middleware.js';
import {
    getUserReportsC, executeUserReportC,
    exportExcelC, exportCsvC, exportPdfC,
    getSavedFiltersC, createSavedFilterC, deleteSavedFilterC
} from '../../controller/postgres/report_builder/dynamic_reports.controller.js';

const router = express.Router();

// User-facing reports
router.get('/', authMiddleware, getUserReportsC);
router.post('/:id/execute', authMiddleware, executeUserReportC);

// Export
router.post('/:id/export/excel', authMiddleware, exportExcelC);
router.post('/:id/export/csv', authMiddleware, exportCsvC);
router.post('/:id/export/pdf', authMiddleware, exportPdfC);

// Saved Filters
router.get('/:id/saved-filters', authMiddleware, getSavedFiltersC);
router.post('/:id/saved-filters', authMiddleware, createSavedFilterC);
router.delete('/:id/saved-filters/:filterId', authMiddleware, deleteSavedFilterC);

export default router;
