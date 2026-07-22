import { getQualityEntryReportS } from "../../../services/quality_reports/quality_reports.service.js";
import ExcelJS from "exceljs";

export const getQualityEntryReportC = async (req, res) => {
    try {
        const result = await getQualityEntryReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportQualityReportC = async (req, res) => {
    const { report, date_from, date_to, bobbin_no } = req.query;
    const filters = { date_from, date_to, bobbin_no };

    try {
        let data = [];
        let columns = [];
        let title = 'Quality Report';

        switch (report) {
            case 'quality_entry':
            case 'quality-entry':
                title = 'Quality Entry Report';
                data = await getQualityEntryReportS(filters);
                columns = ['Bobbin No', 'Bobbin FID', 'Product Type', 'Temp Grade', 'Final Grade',
                    'Avg LSA 1310', 'Avg LSA 1550', 'Avg LSA 1625', 'Avg LSA 1383',
                    'MFD 1310 Top', 'MFD 1310 Bottom', 'MFD 1550 Top', 'MFD 1550 Bottom',
                    'Cut Off Top', 'Cut Off Bottom', 'Cable Cut Off', 'MAC Value',
                    'Clad Dia Top', 'Clad Dia Bottom', 'PMD 1310', 'PMD 1550',
                    'Zero Disp Wave', 'Disp 1550', 'Status', 'Remark'];
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid report type' });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'MES System';
        const sheet = workbook.addWorksheet(title);

        sheet.mergeCells(1, 1, 1, columns.length);
        const titleCell = sheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };

        sheet.mergeCells(2, 1, 2, columns.length);
        sheet.getCell('A2').value = `Period: ${date_from || 'All'} to ${date_to || 'All'} | Generated: ${new Date().toISOString().split('T')[0]}`;
        sheet.getCell('A2').font = { size: 9, italic: true };

        const headerRow = sheet.getRow(4);
        columns.forEach((col, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = col;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        });

        const keys = Object.keys(data[0] || {});
        data.forEach((row, idx) => {
            const excelRow = sheet.getRow(5 + idx);
            keys.forEach((key, i) => {
                excelRow.getCell(i + 1).value = row[key] ?? '';
            });
            if (idx % 2 === 1) {
                excelRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; });
            }
        });

        sheet.columns.forEach(col => { col.width = 15; });
        sheet.views = [{ state: 'frozen', ySplit: 4 }];

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=quality_${report}_report.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Quality Export error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};
