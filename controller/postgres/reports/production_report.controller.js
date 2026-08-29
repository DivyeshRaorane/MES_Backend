import { generateProductionReportS } from "../../../services/reports/production_report.service.js";

/**
 * Generate and download Production Report Excel
 * GET /api/reports/production-report?date=2026-08-24
 */
export const getProductionReportC = async (req, res) => {
  try {
    const { date } = req.query;

    // Default to today if no date provided
    const reportDate = date || new Date().toISOString().split("T")[0];

    const { buffer, fileName } = await generateProductionReportS(reportDate);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);

    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Production Report Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
