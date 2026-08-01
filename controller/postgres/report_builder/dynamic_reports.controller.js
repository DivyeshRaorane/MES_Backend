import {
    getUserReportsS, executeUserReportS, executeReportForExportS,
    getSavedFiltersS, createSavedFilterS, deleteSavedFilterS
} from "../../../services/report_builder/dynamic_reports.service.js";
import { generateExcelBuffer, generateCsvString, generatePdfBuffer } from "../../../services/report_builder/export.service.js";

// ═══════════════════════════════════════════════════════════════
// USER-FACING REPORTS
// ═══════════════════════════════════════════════════════════════

export const getUserReportsC = async (req, res) => {
    try {
        const data = await getUserReportsS(req.user);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const executeUserReportC = async (req, res) => {
    try {
        const ipAddress = req.ip || req.connection?.remoteAddress;
        const data = await executeUserReportS(req.params.id, req.body, req.user, ipAddress);
        res.status(200).json({ success: true, ...data });
    } catch (error) {
        if (error.message === 'Access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message === 'Report not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const exportExcelC = async (req, res) => {
    try {
        const result = await executeReportForExportS(req.params.id, req.body, req.user);
        const buffer = await generateExcelBuffer(result.data, result.columnOrder, result.columnDisplayNames, result.reportName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${result.reportName}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        if (error.message === 'Export access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportCsvC = async (req, res) => {
    try {
        const result = await executeReportForExportS(req.params.id, req.body, req.user);
        const csv = generateCsvString(result.data, result.columnOrder, result.columnDisplayNames);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.reportName}.csv"`);
        res.send(csv);
    } catch (error) {
        if (error.message === 'Export access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportPdfC = async (req, res) => {
    try {
        const result = await executeReportForExportS(req.params.id, req.body, req.user);
        const buffer = await generatePdfBuffer(result.data, result.columnOrder, result.columnDisplayNames, result.reportName);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.reportName}.pdf"`);
        res.send(buffer);
    } catch (error) {
        if (error.message === 'Export access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// SAVED FILTERS
// ═══════════════════════════════════════════════════════════════

export const getSavedFiltersC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const data = await getSavedFiltersS(req.params.id, userId);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSavedFilterC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const data = await createSavedFilterS(req.params.id, userId, req.body);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSavedFilterC = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const result = await deleteSavedFilterS(req.params.filterId, userId);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'Saved filter not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// MULTI-SHEET EXCEL EXPORT
// ═══════════════════════════════════════════════════════════════

export const exportMultiExcelC = async (req, res) => {
    try {
        const result = await executeReportForExportS(req.params.id, req.body, req.user);

        // If not multi-sheet, fall back to single-sheet Excel export
        if (!result.is_multi_sheet) {
            const buffer = await generateExcelBuffer(result.data, result.columnOrder, result.columnDisplayNames, result.reportName);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${result.reportName}.xlsx"`);
            return res.send(buffer);
        }

        // Multi-sheet Excel generation using ExcelJS
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Dynamic Report Builder';
        workbook.created = new Date();

        for (const sheet of result.sheets) {
            const sheetName = (sheet.sheet_name || 'Sheet').replace(/[\\/*?\[\]:]/g, '').substring(0, 31);
            const worksheet = workbook.addWorksheet(sheetName);
            let currentRow = 1;

            for (let ti = 0; ti < sheet.tables.length; ti++) {
                const tableData = sheet.tables[ti];
                const formatting = tableData.formatting || {};

                if (tableData.error) {
                    worksheet.getRow(currentRow).getCell(1).value = `Error in "${tableData.table_name}": ${tableData.error}`;
                    currentRow += 2;
                    continue;
                }

                // Title row
                if (tableData.table_name) {
                    const titleRow = worksheet.getRow(currentRow);
                    titleRow.getCell(1).value = tableData.table_name;
                    titleRow.getCell(1).font = { bold: true, size: 12 };
                    currentRow++;
                }

                const columnDefs = tableData.columns || [];

                // Header row
                const headerRow = worksheet.getRow(currentRow);
                columnDefs.forEach((col, idx) => {
                    const cell = headerRow.getCell(idx + 1);
                    cell.value = col.header;
                    cell.font = {
                        bold: formatting.headerBold !== false,
                        color: { argb: (formatting.headerTextColor || '#ffffff').replace('#', 'FF') }
                    };
                    cell.fill = {
                        type: 'pattern', pattern: 'solid',
                        fgColor: { argb: (formatting.headerBgColor || '#1e293b').replace('#', 'FF') },
                    };
                    if (formatting.borderEnabled !== false) {
                        cell.border = {
                            top: { style: 'thin' }, bottom: { style: 'thin' },
                            left: { style: 'thin' }, right: { style: 'thin' }
                        };
                    }
                });
                currentRow++;

                // Data rows
                for (const row of tableData.data) {
                    const dataRow = worksheet.getRow(currentRow);
                    columnDefs.forEach((col, idx) => {
                        dataRow.getCell(idx + 1).value = row[col.field] ?? '';
                    });
                    currentRow++;
                }

                // Auto-width
                if (formatting.autoWidth !== false) {
                    columnDefs.forEach((col, idx) => {
                        worksheet.getColumn(idx + 1).width = Math.max(col.header.length + 2, 14);
                    });
                }

                // Spacing between tables
                currentRow += (tableData.spacing ?? 2);
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `${result.reportName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(Buffer.from(buffer));
    } catch (error) {
        if (error.message === 'Export access denied') {
            return res.status(403).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
