import ExcelJS from "exceljs";
import {
    getAvailableFunctionsS,
    getFunctionParamsS,
    getAllReportsS,
    getReportByIdS,
    createReportS,
    updateReportS,
    toggleReportStatusS,
    deleteReportS,
    getUserReportsS,
    executeReportS,
    getSectionsS,
    getCompatibleFunctionsS
} from "../../../services/function_reports/function_reports.service.js";

// ReportError carries its own HTTP status; other errors fall back to the given default.
const statusOf = (error, fallback = 500) => error.statusCode || fallback;

const csvCell = (value) => {
    if (value === null || value === undefined) return "";
    const str = typeof value === "object" && !(value instanceof Date) ? JSON.stringify(value) : String(value);
    // Escape commas, quotes and newlines
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const excelCell = (value) => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date || typeof value !== "object") return value;
    return JSON.stringify(value);
};

// â”€â”€â”€ 1. GET /available-functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getAvailableFunctionsC = async (req, res) => {
    try {
        const data = await getAvailableFunctionsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 2. GET /function-params/:schemaName/:functionName â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getFunctionParamsC = async (req, res) => {
    try {
        const { schemaName, functionName } = req.params;
        const data = await getFunctionParamsS(schemaName, functionName);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 3. GET / (all reports - admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getAllReportsC = async (req, res) => {
    try {
        const data = await getAllReportsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("[function_reports] getAllReports error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 4. GET /:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getReportByIdC = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await getReportByIdS(id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 5. POST / (create report) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const createReportC = async (req, res) => {
    try {
        const created_by = req.user?.user_id || req.user?.userId || req.user?.emp_id || null;
        const data = await createReportS({ ...req.body, created_by });
        res.status(201).json({ success: true, data });
    } catch (error) {
        const status = statusOf(error, error.message.includes("does not exist") || error.message.includes("already exists") ? 400 : 500);
        res.status(status).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 6. PUT /:id (update report) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const updateReportC = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await updateReportS(id, req.body);
        res.status(200).json({ success: true, data });
    } catch (error) {
        const status = statusOf(error, error.message.includes("not found") ? 404
            : error.message.includes("does not exist") || error.message.includes("already exists") ? 400
            : 500);
        res.status(status).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 7. PATCH /:id/toggle-status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const toggleReportStatusC = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await toggleReportStatusS(id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 8. DELETE /:id (soft delete) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const deleteReportC = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await deleteReportS(id);
        res.status(200).json({ success: true, data, message: "Report deleted successfully." });
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 9. GET /user/reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getUserReportsC = async (req, res) => {
    try {
        const sectionFilter = req.query.section || null;
        const data = await getUserReportsS(req.user, sectionFilter);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 10. POST /:id/execute â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const executeReportC = async (req, res) => {
    try {
        const { id } = req.params;
        const params = req.body.params || {};
        const result = await executeReportS(id, params);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        const status = statusOf(error, error.message.includes("not found") ? 404
            : error.message.includes("required") || error.message.includes("Invalid") ? 400
            : 500);
        res.status(status).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 11. POST /:id/export/excel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const exportExcelC = async (req, res) => {
    try {
        const { id } = req.params;
        const params = req.body.params || {};
        const result = await executeReportS(id, params);

        // Build workbook
        const workbook = new ExcelJS.Workbook();

        if (result.report_type === "multi_sheet") {
            // One worksheet per function, in the stored sequence
            for (const item of result.items) {
                const sheet = workbook.addWorksheet(item.sheet_name);
                if (item.error) {
                    sheet.addRow([`Error: ${item.error}`]);
                    continue;
                }
                sheet.addRow(item.columns.map(col => col.header)).font = { bold: true };
                item.data.forEach(row => {
                    sheet.addRow(item.columns.map(col => excelCell(row[col.field])));
                });
                item.columns.forEach((_, i) => { sheet.getColumn(i + 1).width = 20; });
            }
        } else if (result.report_type === "multi_table") {
            // All functions stacked on ONE worksheet: title, header, rows, blank line
            const sheet = workbook.addWorksheet("Report");
            let maxColumns = 1;
            for (const item of result.items) {
                sheet.addRow([item.title]).font = { bold: true, size: 13 };
                if (item.error) {
                    sheet.addRow([`Error: ${item.error}`]);
                } else {
                    sheet.addRow(item.columns.map(col => col.header)).font = { bold: true };
                    item.data.forEach(row => {
                        sheet.addRow(item.columns.map(col => excelCell(row[col.field])));
                    });
                    maxColumns = Math.max(maxColumns, item.columns.length);
                }
                sheet.addRow([]);
            }
            for (let i = 1; i <= maxColumns; i++) sheet.getColumn(i).width = 20;
        } else {
            const worksheet = workbook.addWorksheet("Report");

            // Add header row
            if (result.columns && result.columns.length > 0) {
                worksheet.columns = result.columns.map(col => ({
                    header: col.header,
                    key: col.field,
                    width: 20
                }));
            }

            // Add data rows
            result.data.forEach(row => {
                worksheet.addRow(row);
            });

            // Style header
            worksheet.getRow(1).font = { bold: true };
        }

        // Get report name for filename
        const report = await getReportByIdS(id);
        const filename = (report?.report_name || "report").replace(/[^a-zA-Z0-9_-]/g, "_");

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        const status = statusOf(error, error.message.includes("not found") ? 404
            : error.message.includes("required") ? 400
            : 500);
        res.status(status).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 12. POST /:id/export/csv â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const exportCsvC = async (req, res) => {
    try {
        const { id } = req.params;
        const params = req.body.params || {};
        const result = await executeReportS(id, params);

        // Get report name for filename
        const report = await getReportByIdS(id);
        const filename = (report?.report_name || "report").replace(/[^a-zA-Z0-9_-]/g, "_");

        // Build CSV content
        let csv = "";

        if (result.items) {
            // Multi report: CSV has no sheets, so stack the tables (title, header, rows, blank line)
            for (const item of result.items) {
                csv += csvCell(item.title) + "\n";
                if (item.error) {
                    csv += csvCell(`Error: ${item.error}`) + "\n";
                } else {
                    csv += item.columns.map(col => csvCell(col.header)).join(",") + "\n";
                    item.data.forEach(row => {
                        csv += item.columns.map(col => csvCell(row[col.field])).join(",") + "\n";
                    });
                }
                csv += "\n";
            }
        } else {
            const headers = result.columns.map(col => col.header);
            const fields = result.columns.map(col => col.field);

            csv = headers.join(",") + "\n";

            result.data.forEach(row => {
                csv += fields.map(field => csvCell(row[field])).join(",") + "\n";
            });
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
        res.send(csv);
    } catch (error) {
        const status = statusOf(error, error.message.includes("not found") ? 404
            : error.message.includes("required") ? 400
            : 500);
        res.status(status).json({ success: false, message: error.message });
    }
};

// â”€â”€â”€ 13. GET /sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getSectionsC = async (req, res) => {
    try {
        const data = await getSectionsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /compatible-functions?schema_name=public&function_name=fn_a
// Functions that take exactly the same parameters as fn_a (for multi reports).

export const getCompatibleFunctionsC = async (req, res) => {
    try {
        const { schema_name, function_name } = req.query;
        const data = await getCompatibleFunctionsS(schema_name || "public", function_name);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(statusOf(error)).json({ success: false, message: error.message });
    }
};
