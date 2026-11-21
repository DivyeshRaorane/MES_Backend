import { generateProductionReportS } from "../../../services/reports/production_report.service.js";

/**
 * Generate and download Production Report Excel
 * GET /api/reports/production-report?date=2026-08-24
 */
export const getProductionReportC = async (req, res) => {
  try {
    const { date } = req.query;

    // No date given: let the service default to yesterday (IST), the last
    // complete day. Do not default to today here, or the two would disagree.
    const { buffer, fileName } = await generateProductionReportS(date);

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
