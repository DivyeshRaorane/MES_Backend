import { getPtAllocationReportS, getPtEntryReportS, getPtFlawsReportS, getFiberEntryReportS, getColoringReportS, getRewindingReportS } from "../../../services/pt_reports/pt_reports.service.js";
import ExcelJS from "exceljs";

export const getPtAllocationReportC = async (req, res) => {
    try {
        const result = await getPtAllocationReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPtEntryReportC = async (req, res) => {
    try {
        const result = await getPtEntryReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPtFlawsReportC = async (req, res) => {
    try {
        const result = await getPtFlawsReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFiberEntryReportC = async (req, res) => {
    try {
        const result = await getFiberEntryReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};







export const getRewindingReportC = async (req, res) => {
    try {
        const result = await getRewindingReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getColoringReportC = async (req, res) => {
    try {
        const result = await getColoringReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportPtReportC = async (req, res) => {
    const { report, date_from, date_to, spool_id } = req.query;
    const filters = { date_from, date_to, spool_id };

    try {
        let data = [];
        let columns = [];
        let title = 'PT Report';

        switch (report) {
            case 'allocation':
            case 'pt_allocation':
                title = 'PT Allocation Report';
                data = await getPtAllocationReportS(filters);
                columns = ['Spool ID', 'Preform ID', 'Allocation Date', 'Tower', 'Drawn Length',
                    'Product Type', 'PT Strain', 'Machine No', 'Allocated By', 'Shift Incharge',
                    'Remark', 'PT Complete', 'Rejected'];
                break;
            case 'entry':
            case 'pt_entry':
            case 'entries':
                title = 'PT Entry Report';
                data = await getPtEntryReportS(filters);
                columns = ['Spool ID', 'Preform ID', 'Drawn Length', 'Tower', 'Drawn Date',
                    'PT Entry', 'FID', 'Bobbin No', 'Spool Status', 'PT Machine',
                    'Operator', 'Shift Incharge', 'Bobbin Color', 'Bobbin Type',
                    'PT Length', 'Status', 'Payoff Vibration', 'Dancer Vibration',
                    'Rejection', 'Is Break'];
                break;
            case 'flaws':
            case 'pt_flaws':
                title = 'PT Flaws Report';
                data = await getPtFlawsReportS(filters);
                columns = ['Flaw ID', 'Spool ID', 'Reason', 'Pos 1', 'Pos 2',
                    'Defect Length', 'Actual Cutting', 'Is Done', 'Entry Date', 'Entry Time'];
                break;
            case 'fiber_entry':
            case 'fiber-entry':
                title = 'Fiber Entry Report';
                data = await getFiberEntryReportS(filters);
                columns = ['FID', 'Bobbin No', 'Spool ID', 'Spool FID', 'Preform ID',
                    'Tower', 'PT Machine', 'Fiber Length', 'Drawn Length', 'Drawn Date',
                    'PT Date', 'Operator', 'Fiber Type', 'Fiber Color', 'Product Type',
                    'Preform Type', 'PT Strain', 'Temp Grade', 'Final Grade'];
                break;
            case 'coloring':
            case 'colouring':
                title = 'Coloring Entry Report';
                data = await getColoringReportS(filters);
                columns = ['Bobbin No', 'Original Color', 'Current Color', 'Color Batch Code',
                    'Fiber Length', 'Is Scrap', 'Machine No', 'FID', 'Bobbin Type',
                    'Operator', 'Bobbin Colour', 'Remark', 'Entry Date'];
                break;
            case 'rewinding':
                title = 'Rewinding Entry Report';
                data = await getRewindingReportS(filters);
                columns = ['Parent Bobbin', 'Bobbin No', 'Fiber Length', 'Is Scrap', 'FID',
                    'Machine No', 'Rew Reason', 'Rew Type', 'Bobbin Type', 'Operator',
                    'Bobbin Colour', 'Remark'];
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid report type' });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'MES System';
        const sheet = workbook.addWorksheet(title);

        // Title row
        sheet.mergeCells(1, 1, 1, columns.length);
        const titleCell = sheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };

        // Filter info
        sheet.mergeCells(2, 1, 2, columns.length);
        sheet.getCell('A2').value = `Period: ${date_from || 'All'} to ${date_to || 'All'} | Generated: ${new Date().toISOString().split('T')[0]}`;
        sheet.getCell('A2').font = { size: 9, italic: true };

        // Header row
        const headerRow = sheet.getRow(4);
        columns.forEach((col, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = col;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        });

        // Data rows
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
        res.setHeader('Content-Disposition', `attachment; filename=pt_${report}_report.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('PT Export error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};
