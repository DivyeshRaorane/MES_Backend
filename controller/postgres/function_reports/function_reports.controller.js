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
    getSectionsS
} from "../../../services/function_reports/function_reports.service.js";

// ─── 1. GET /available-functions ─────────────────────────────────────────────

export const getAvailableFunctionsC = async (req, res) => {
    try {
        const data = await getAvailableFunctionsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── 2. GET /function-params/:schemaName/:functionName ───────────────────────

export const getFunctionParamsC = async (req, res) => {
    try {
        const { schemaName, functionName } = req.params;
        const data = await getFunctionParamsS(schemaName, functionName);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── 3. GET / (all reports - admin) ──────────────────────────────────────────

export const getAllReportsC = async (req, res) => {
    try {
        const data = await getAllReportsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("[function_reports] getAllReports error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── 4. GET /:id ─────────────────────────────────────────────────────────────

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

// ─── 5. POST / (create report) ───────────────────────────────────────────────

export const createReportC = async (req, res) => {
    try {
        const created_by = req.user?.user_id || req.user?.userId || null;
        const data = await createReportS({ ...req.body, created_by });
        res.status(201).json({ success: true, data });
    } catch (error) {
        const status = error.message.includes("does not exist") || error.message.includes("already exists") ? 400 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// ─── 6. PUT /:id (update report) ─────────────────────────────────────────────

export const updateReportC = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await updateReportS(id, req.body);
        res.status(200).json({ success: true, data });
    } catch (error) {
        const status = error.message.includes("not found") ? 404
            : error.message.includes("does not exist") || error.message.includes("already exists") ? 400
            : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// ─── 7. PATCH /:id/toggle-status ─────────────────────────────────────────────

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

// ─── 8. DELETE /:id (soft delete) ────────────────────────────────────────────

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

// ─── 9. GET /user/reports ────────────────────────────────────────────────────

export const getUserReportsC = async (req, res) => {
    try {
        const sectionFilter = req.query.section || null;
        const data = await getUserReportsS(req.user, sectionFilter);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── 10. POST /:id/execute ───────────────────────────────────────────────────

export const executeReportC = async (req, res) => {
    try {
        const { id } = req.params;
        const params = req.body.params || {};
        const result = await executeReportS(id, params);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        const status = error.message.includes("not found") ? 404
            : error.message.includes("required") || error.message.includes("Invalid") ? 400
            : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// ─── 11. POST /:id/export/excel ──────────────────────────────────────────────

export const exportExcelC = async (req, res) => {
    try {
        const { id } = req.params;
        const params = req.body.params || {};
        const result = await executeReportS(id, params);

        // Build workbook
        const workbook = new ExcelJS.Workbook();
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

        // Get report name for filename
        const report = await getReportByIdS(id);
        const filename = (report?.report_name || "report").replace(/[^a-zA-Z0-9_-]/g, "_");

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        const status = error.message.includes("not found") ? 404
            : error.message.includes("required") ? 400
            : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// ─── 12. POST /:id/export/csv ────────────────────────────────────────────────

export const exportCsvC = async (req, res) => {
    try {
        const { id } = req.params;
        const params = req.body.params || {};
        const result = await executeReportS(id, params);

        // Get report name for filename
        const report = await getReportByIdS(id);
        const filename = (report?.report_name || "report").replace(/[^a-zA-Z0-9_-]/g, "_");

        // Build CSV content
        const headers = result.columns.map(col => col.header);
        const fields = result.columns.map(col => col.field);

        let csv = headers.join(",") + "\n";

        result.data.forEach(row => {
            const line = fields.map(field => {
                const value = row[field];
                if (value === null || value === undefined) return "";
                const str = String(value);
                // Escape commas and quotes
                if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            csv += line.join(",") + "\n";
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
        res.send(csv);
    } catch (error) {
        const status = error.message.includes("not found") ? 404
            : error.message.includes("required") ? 400
            : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

// ─── 13. GET /sections ───────────────────────────────────────────────────────

export const getSectionsC = async (req, res) => {
    try {
        const data = await getSectionsS();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
