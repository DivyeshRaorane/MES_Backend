import express from 'express';
import {
    getUserReportsC, executeUserReportC,
    exportExcelC, exportCsvC, exportPdfC,
    getSavedFiltersC, createSavedFilterC, deleteSavedFilterC,
    exportMultiExcelC
} from '../../controller/postgres/report_builder/dynamic_reports.controller.js';

const router = express.Router();

// User-facing reports
router.get('/', getUserReportsC);
router.post('/:id/execute', executeUserReportC);

// Export
router.post('/:id/export/excel', exportExcelC);
router.post('/:id/export/csv', exportCsvC);
router.post('/:id/export/pdf', exportPdfC);
router.post('/:id/export/multi-excel', exportMultiExcelC);

// Saved Filters
router.get('/:id/saved-filters', getSavedFiltersC);
router.post('/:id/saved-filters', createSavedFilterC);
router.delete('/:id/saved-filters/:filterId', deleteSavedFilterC);

export default router;
