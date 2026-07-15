import {
    getDashboardS, getProductionSummaryS, getPreformReportS,
    getSpoolReportS, getFlawReportS, getBreakReportS,
    getTowerPerformanceS, getShiftPerformanceS, getOperatorPerformanceS,
    getDrawParametersS, getScrapAnalysisS, getPreformAcceptReportS, getHandleJoinReportS, getPreformAllocReportS, getDrawEntryReportS
} from "../../../services/draw_reports/draw_reports.service.js";
import ExcelJS from "exceljs";

const getFilters = (query) => ({
    date_from: query.date_from,
    date_to: query.date_to,
    tower_no: query.tower_no || null,
    shift: query.shift || null,
    preform_id: query.preform_id || null,
    spool_id: query.spool_id || null
});

export const getDashboardC = async (req, res) => {
    try {
        const result = await getDashboardS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductionSummaryC = async (req, res) => {
    try {
        const result = await getProductionSummaryS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPreformReportC = async (req, res) => {
    try {
        const result = await getPreformReportS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSpoolReportC = async (req, res) => {
    try {
        const result = await getSpoolReportS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFlawReportC = async (req, res) => {
    try {
        const result = await getFlawReportS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getBreakReportC = async (req, res) => {
    try {
        const result = await getBreakReportS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTowerPerformanceC = async (req, res) => {
    try {
        const result = await getTowerPerformanceS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getShiftPerformanceC = async (req, res) => {
    try {
        const result = await getShiftPerformanceS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOperatorPerformanceC = async (req, res) => {
    try {
        const result = await getOperatorPerformanceS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDrawParametersC = async (req, res) => {
    try {
        const result = await getDrawParametersS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getScrapAnalysisC = async (req, res) => {
    try {
        const result = await getScrapAnalysisS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPreformAcceptReportC = async (req, res) => {
    try {
        const result = await getPreformAcceptReportS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHandleJoinReportC = async (req, res) => {
    try {
        const result = await getHandleJoinReportS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPreformAllocReportC = async (req, res) => {
    try {
        const result = await getPreformAllocReportS(getFilters(req.query));
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDrawEntryReportC = async (req, res) => {
    try {
        const result = await getDrawEntryReportS(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportReportC = async (req, res) => {
    const { report, date_from, date_to, tower_no, shift } = req.query;
    const filters = { date_from, date_to, tower_no, shift };

    try {
        let data = [];
        let columns = [];
        let title = 'Draw Report';

        switch (report) {
            case 'production':
                title = 'Production Summary';
                data = await getProductionSummaryS(filters);
                columns = ['Date', 'Preforms', 'Drawn Length (km)', 'Drawn Weight (kg)', 'Spools', 'Avg Length', 'Total Scrap'];
                break;
            case 'preform':
                title = 'Preform Report';
                data = await getPreformReportS(filters);
                columns = ['Preform ID', 'Weight', 'Expected Length', 'Actual Length', 'Spools'];
                break;
            case 'spool':
                title = 'Spool Report';
                data = await getSpoolReportS(filters);
                columns = ['Spool ID', 'FID', 'Preform', 'Date', 'Tower', 'Shift', 'Length', 'Weight', 'Status'];
                break;
            case 'flaw':
            case 'flaws':
                title = 'Draw Flaw Report';
                data = await getFlawReportS(filters);
                columns = ['Flaw ID', 'Spool ID', 'Reason', 'Pos 1', 'Pos 2',
                    'Defect Length', 'Actual Cutting', 'Entry Date', 'Entry Time'];
                break;
            case 'break':
                title = 'Break Analysis';
                data = await getBreakReportS(filters);
                columns = ['Fiber ID', 'Machine', 'Break Length', 'Type', 'Category', 'Main Type', 'Sub Reason', 'Analyst', 'Date'];
                break;
            case 'tower':
                title = 'Tower Performance';
                data = await getTowerPerformanceS(filters);
                columns = ['Tower', 'Preforms', 'Drawn (km)', 'Spools', 'Avg Speed', 'Yield %'];
                break;
            case 'shift':
                title = 'Shift Performance';
                data = await getShiftPerformanceS(filters);
                columns = ['Shift', 'Preforms', 'Drawn (km)', 'Spools', 'Avg Speed', 'Yield %'];
                break;
            case 'operator':
                title = 'Operator Performance';
                data = await getOperatorPerformanceS(filters);
                columns = ['Operator', 'Preforms', 'Drawn (km)', 'Spools', 'Avg Speed'];
                break;
            case 'parameters':
                title = 'Draw Parameters';
                data = await getDrawParametersS(filters);
                columns = ['Group', 'Avg Speed', 'Avg Tension', 'Furnace', 'Argon', 'Helium', 'CO2', 'N2', 'Pri Press', 'Sec Press'];
                break;
            case 'scrap':
                title = 'Scrap Analysis';
                data = await getScrapAnalysisS(filters);
                columns = ['Group', 'Top Scrap', 'Bottom Scrap', 'Total Scrap', 'Scrap %'];
                break;
            case 'preform_accept':
                title = 'Preform Acceptance Report';
                data = await getPreformAcceptReportS(filters);
                columns = ['Preform ID', 'Weight', 'Charge Weight', 'Preform Length', 'Charge Length',
                    'Drawing Length', 'Material Code', 'Dia Variation', 'Cut Off', 'MFD', 'Accepted By',
                    'Preform Type', 'Material Desc', 'Remarks', 'Draw Instruction',
                    'Status', 'Rejection Note', 'Product Type', 'Entry Date', 'Entry Time'];
                break;
            case 'handle_join':
                title = 'Handle Join Report';
                data = await getHandleJoinReportS(filters);
                columns = ['Preform ID', 'Handle No', 'Handle Length', 'Handle Diameter', 'Cone Length',
                    'Dia1', 'Dia2', 'Dia3', 'Dia4', 'Dia5',
                    'H2 Flow 1', 'H2 Flow 2', 'H2 Flow 3',
                    'O2 Line1 Flow 1', 'O2 Line1 Flow 2', 'O2 Line1 Flow 3',
                    'H2 Flow 1 Time', 'H2 Flow 2 Time', 'H2 Flow 3 Time',
                    'O2 Flow 1 Time', 'O2 Flow 2 Time', 'O2 Flow 3 Time',
                    'H2 Flow 1 Cons', 'H2 Flow 2 Cons', 'H2 Flow 3 Cons',
                    'O2 Flow 1 Cons', 'O2 Flow 2 Cons', 'O2 Flow 3 Cons',
                    'Joined By', 'Additional Notes', 'Handle Join', 'Allocated',
                    'Handle Rejected', 'Entry Date', 'Entry Time'];
                break;
            case 'preform_alloc':
                title = 'Preform Allocation Report';
                data = await getPreformAllocReportS(filters);
                columns = ['Preform ID', 'Allocation Date', 'Tower', 'Shift', 'Operator',
                    'Preform Type', 'Product Type', 'Process Type', 'Draw Done',
                    'Avg Diameter', 'Draw Instruction', 'Process Remarks', 'Entry Date', 'Entry Time'];
                break;
            case 'draw_entry':
                title = 'Draw Entry Report';
                data = await getDrawEntryReportS(filters);
                columns = ['Spool ID', 'Spool FID', 'Preform ID', 'Tower', 'Start Date', 'End Date',
                    'Start Time', 'End Time', 'Drawn Weight', 'Drawn Length', 'Balance Weight',
                    'Shift', 'Line Speed', 'Tension', 'Furnace Power', 'Argon', 'Helium', 'Tube He',
                    'CO2', 'N2', 'UV Air', 'Winding Obs', 'SCR Obs', 'Top Scrap', 'Bottom Scrap',
                    'Die Clean', 'Status', 'Indication', 'Reason', 'Remark',
                    'Pri Coating', 'Sec Coating', 'Coating Type', 'Pri Pressure', 'Sec Pressure',
                    'Pri Batch', 'Sec Batch', 'Process Type', 'Shift Incharge', 'Furnace Op',
                    'Die Op', 'Ground Op', 'PT Allocated', 'Preform Type', 'Product Type',
                    'Spool No', 'Is First', 'Is Last'];
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

        // Auto width
        sheet.columns.forEach(col => { col.width = 15; });

        // Freeze header
        sheet.views = [{ state: 'frozen', ySplit: 4 }];

        // Send
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=draw_${report}_report.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};
