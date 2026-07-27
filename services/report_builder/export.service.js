/**
 * Export Service for Dynamic Reports
 * Generates Excel, CSV, and PDF buffers from report data.
 *
 * Note: For Excel export, install: npm install exceljs
 * For PDF export, install: npm install pdfkit
 * If these packages are not installed, the functions will throw descriptive errors.
 */

// ═══════════════════════════════════════════════════════════════
// EXCEL EXPORT
// ═══════════════════════════════════════════════════════════════

export const generateExcelBuffer = async (data, columnOrder, columnDisplayNames, reportName) => {
    let ExcelJS;
    try {
        ExcelJS = (await import('exceljs')).default;
    } catch {
        throw new Error('exceljs package not installed. Run: npm install exceljs');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportName || 'Report');

    // Build headers
    const headers = (columnOrder || []).map(key => {
        const displayName = columnDisplayNames?.[key] || key;
        return { header: displayName, key, width: 20 };
    });

    // If no column_order, use keys from first row
    if (headers.length === 0 && data.length > 0) {
        for (const key of Object.keys(data[0])) {
            headers.push({ header: key, key, width: 20 });
        }
    }

    worksheet.columns = headers;

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    for (const row of data) {
        worksheet.addRow(row);
    }

    // Auto-fit columns (approximate)
    worksheet.columns.forEach(col => {
        let maxLen = col.header.length;
        col.eachCell({ includeEmpty: false }, cell => {
            const len = String(cell.value || '').length;
            if (len > maxLen) maxLen = len;
        });
        col.width = Math.min(maxLen + 2, 50);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

// ═══════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════

export const generateCsvString = (data, columnOrder, columnDisplayNames) => {
    if (!data || data.length === 0) return '';

    const keys = columnOrder && columnOrder.length > 0 ? columnOrder : Object.keys(data[0]);

    // Header row
    const headers = keys.map(key => {
        const name = columnDisplayNames?.[key] || key;
        return escapeCsvField(name);
    });

    const rows = [headers.join(',')];

    // Data rows
    for (const row of data) {
        const values = keys.map(key => escapeCsvField(String(row[key] ?? '')));
        rows.push(values.join(','));
    }

    return rows.join('\n');
};

const escapeCsvField = (field) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
};

// ═══════════════════════════════════════════════════════════════
// PDF EXPORT
// ═══════════════════════════════════════════════════════════════

export const generatePdfBuffer = async (data, columnOrder, columnDisplayNames, reportName) => {
    let PDFDocument;
    try {
        PDFDocument = (await import('pdfkit')).default;
    } catch {
        throw new Error('pdfkit package not installed. Run: npm install pdfkit');
    }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 30 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(14).font('Helvetica-Bold').text(reportName || 'Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1);

        const keys = columnOrder && columnOrder.length > 0 ? columnOrder : (data.length > 0 ? Object.keys(data[0]) : []);
        const headers = keys.map(key => columnDisplayNames?.[key] || key);

        if (keys.length === 0) {
            doc.text('No data available');
            doc.end();
            return;
        }

        // Calculate column widths
        const pageWidth = doc.page.width - 60;
        const colWidth = Math.min(pageWidth / keys.length, 120);
        const fontSize = Math.min(7, 60 / keys.length + 4);

        // Table header
        const startX = 30;
        let y = doc.y;

        doc.fontSize(fontSize).font('Helvetica-Bold');
        headers.forEach((header, i) => {
            doc.text(String(header).substring(0, 20), startX + i * colWidth, y, {
                width: colWidth - 4,
                ellipsis: true,
                lineBreak: false
            });
        });

        y += 15;
        doc.moveTo(startX, y).lineTo(startX + keys.length * colWidth, y).stroke();
        y += 5;

        // Table rows (limit to prevent huge PDFs)
        const maxRows = Math.min(data.length, 1000);
        doc.font('Helvetica').fontSize(fontSize);

        for (let r = 0; r < maxRows; r++) {
            if (y > doc.page.height - 50) {
                doc.addPage();
                y = 30;

                // Re-draw header on new page
                doc.font('Helvetica-Bold').fontSize(fontSize);
                headers.forEach((header, i) => {
                    doc.text(String(header).substring(0, 20), startX + i * colWidth, y, {
                        width: colWidth - 4,
                        ellipsis: true,
                        lineBreak: false
                    });
                });
                y += 15;
                doc.moveTo(startX, y).lineTo(startX + keys.length * colWidth, y).stroke();
                y += 5;
                doc.font('Helvetica').fontSize(fontSize);
            }

            const row = data[r];
            keys.forEach((key, i) => {
                const val = String(row[key] ?? '').substring(0, 25);
                doc.text(val, startX + i * colWidth, y, {
                    width: colWidth - 4,
                    ellipsis: true,
                    lineBreak: false
                });
            });
            y += 12;
        }

        if (data.length > maxRows) {
            doc.moveDown(1);
            doc.text(`... and ${data.length - maxRows} more rows (truncated for PDF)`);
        }

        // Footer
        doc.moveDown(1);
        doc.fontSize(7).text(`Total rows: ${data.length}`, { align: 'right' });

        doc.end();
    });
};
