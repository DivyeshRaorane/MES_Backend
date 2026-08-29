import ExcelJS from "exceljs";
import pool from "../../db/postgres.js";

/**
 * Generate Production Report Excel with 3 sheets
 * Sheet 1: Cover Page
 * Sheet 2: Yield / PT Proof / Optical Packing
 * Sheet 3: OEE Report (On Date + Cumulative)
 */
export const generateProductionReportS = async (reportDate) => {
  const date = reportDate || new Date().toISOString().split("T")[0];
  const formattedDate = formatDateDDMMYYYY(date);

  // Fetch all data in parallel
  const [yieldData, ptData, breakData, defectData, packingData, fgStockData, prodStagesData, prodTrendData, oeeOnDate, oeeCumulative] = await Promise.all([
    pool.query(`SELECT * FROM public.fn_draw_tower_yield_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_pt_proof_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_machine_wise_break_data($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_wise_defect($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_optical_packing_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_fg_stock()`),
    pool.query(`SELECT * FROM public.fn_production_stages($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_production_trend_summary($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_oee_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_oee_report($1, $2)`, [getFirstDayOfMonth(date), getYesterday(date)]),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MES System";
  workbook.created = new Date();

  // ========== SHEET 1: Cover Page ==========
  buildCoverSheet(workbook, formattedDate, prodStagesData.rows, prodTrendData.rows);

  // ========== SHEET 2: Yield / PT / Break / Defect / Packing / FG Stock ==========
  buildProductionSheet(workbook, formattedDate, yieldData.rows, ptData.rows, breakData.rows, defectData.rows, packingData.rows, fgStockData.rows);

  // ========== SHEET 3: OEE Report ==========
  buildOEESheet(workbook, formattedDate, date, oeeOnDate.rows, oeeCumulative.rows);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Prod_Report_${formattedDate.replace(/\./g, "-")}.xlsx`;

  return { buffer, fileName };
};

// ==================== SHEET 1: COVER PAGE ====================
function buildCoverSheet(workbook, formattedDate, prodStagesData, prodTrendData) {
  const ws = workbook.addWorksheet("Production");

  // Set column widths
  ws.columns = [
    { width: 28 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 16 },
    { width: 18 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 14 }, { width: 10 },
  ];

  // Merge cells for header area
  ws.mergeCells("A3:K3");
  ws.mergeCells("A5:K5");
  ws.mergeCells("A7:K7");

  // Company Name
  const companyCell = ws.getCell("A3");
  companyCell.value = "West Coast Optilinks Hyderabad";
  companyCell.font = { size: 30, bold: true, color: { argb: "FF003399" } };
  companyCell.alignment = { horizontal: "center", vertical: "middle" };

  // Plant Name
  const plantCell = ws.getCell("A5");
  plantCell.value = "OPTICAL FIBRE PLANT - HYDERABAD";
  plantCell.font = { size: 30, bold: true, color: { argb: "FF003399" } };
  plantCell.alignment = { horizontal: "center", vertical: "middle" };

  // Report Title
  const titleCell = ws.getCell("A7");
  titleCell.value = `Daily Production Report For :${formattedDate}`;
  titleCell.font = { size: 30, bold: true, color: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Set row heights for better spacing
  ws.getRow(3).height = 45;
  ws.getRow(5).height = 45;
  ws.getRow(7).height = 45;

  // ===== PRODUCTION STAGES TABLE =====
  let currentRow = 10;

  currentRow = addSectionTitle(ws, currentRow, "PRODUCTION STAGES SUMMARY", `Date: ${formattedDate}`, 11);

  const stageHeaders = [
    "Production Stage", "Unit", "Volume (On Date)", "Yield (On Date)",
    "Volume Target", "Volume Achieved", "Planned Yield", "Yield Achieved",
    "Loss %", "WIP Target", "WIP",
  ];
  currentRow = addTableHeaders(ws, currentRow, stageHeaders);

  prodStagesData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.production_stage, row.unit, row.volume_ondt, row.yield_ondt,
      row.volume_target, row.volume_achieved, row.planned_yield, row.yield_achieved,
      row.loss_pct, row.wip_target, row.wip,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
    });
    // First column left-aligned
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    currentRow++;
  });

  currentRow += 2;

  // ===== PRODUCTION TREND TABLE =====
  // Data format: metric_name, target_val, on_date_val, cumm_val, m1_label, m1_val, ..., m6_label, m6_val

  // Get month labels from first row
  const firstRow = prodTrendData[0];
  const monthLabels = [];
  if (firstRow) {
    for (let i = 1; i <= 6; i++) {
      const label = firstRow[`m${i}_label`];
      if (label) monthLabels.push(label);
    }
  }

  const trendColSpan = 4 + monthLabels.length; // Metric + Target + On Date + Cumm + months
  currentRow = addSectionTitle(ws, currentRow, "PRODUCTION TREND", `Last 6 Months`, trendColSpan);

  // Headers: Metric | Target | On Date | Cumulative | Month1 | Month2 | ...
  const trendHeaders = ["Metric", "Target", "On Date", "Cumulative", ...monthLabels];
  currentRow = addTableHeaders(ws, currentRow, trendHeaders);

  prodTrendData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);

    // Build values array
    const values = [
      row.metric_name,
      row.target_val,
      row.on_date_val,
      row.cumm_val,
    ];
    for (let i = 1; i <= 6; i++) {
      const val = row[`m${i}_val`];
      if (row[`m${i}_label`]) values.push(val);
    }

    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== undefined && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
    });
    // First column left-aligned
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    currentRow++;
  });
}

// ==================== SHEET 2: PRODUCTION DATA ====================
function buildProductionSheet(workbook, formattedDate, yieldData, ptData, breakData, defectData, packingData, fgStockData) {
  const ws = workbook.addWorksheet("Production Report");

  // Column widths
  ws.columns = [
    { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 14 }, { width: 14 },
  ];

  let currentRow = 1;

  // ===== SECTION 1: DRAW TOWER YIELD REPORT =====
  currentRow = addSectionTitle(ws, currentRow, "DRAW TOWER YIELD REPORT", `Date: ${formattedDate}`, 9);

  // Headers
  const yieldHeaders = [
    "Draw Tower",
    "Drawn (Km)", "Draw Brk", "Draw Yield %", "Brks/10000",
    "Cumm Drawn (Km)", "Cumm Brk", "Cumm Yield %", "Cumm Brks/10000",
  ];
  currentRow = addTableHeaders(ws, currentRow, yieldHeaders);

  // Data rows
  yieldData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.draw_tower,
      row.ondate_drawn_km, row.ondate_draw_brk_num, row.ondate_draw_yield, row.ondate_dr_brks_10000,
      row.cumm_drawn_km, row.cumm_draw_brk_num, row.cumm_draw_yield, row.cumm_dr_brks_10000,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.draw_tower === "TOTAL") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });

  currentRow += 2;

  // ===== SECTION 2: PT PROOF REPORT =====
  currentRow = addSectionTitle(ws, currentRow, "PT PROOF TEST REPORT", `Date: ${formattedDate}`, 11);

  const ptHeaders = [
    "Draw Tower",
    "Total PT (Km)", "PT Yield %", "50.4 %", "PT Brks",
    "Cumm PT (Km)", "Cumm Yield %", "Cumm 50.4 %", "Cumm Brks",
    "Drawn/Theo (Km)", "Cumm Drawn/Theo",
  ];
  currentRow = addTableHeaders(ws, currentRow, ptHeaders);

  ptData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.draw_tower,
      row.ondate_total_pt, row.ondate_pt_yield, row.ondate_pt_50_4, row.ondate_pt_brks_num,
      row.cumm_total_pt, row.cumm_pt_yield, row.cumm_pt_50_4, row.cumm_pt_brks_num,
      row.ondate_drwn_km_theo_km, row.cumm_drwn_km_theo_km,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.draw_tower === "TOTAL") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });

  currentRow += 2;

  // ===== SECTION 3: MACHINE WISE BREAK DATA =====
  currentRow = addSectionTitle(ws, currentRow, "MACHINE WISE BREAK DATA", `Date: ${formattedDate}`, 3);

  const breakHeaders = [
    "Draw Tower", "On Date PT Brks/1000 Km", "Cumm PT Brks/1000 Km",
  ];
  currentRow = addTableHeaders(ws, currentRow, breakHeaders);

  breakData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.draw_tower,
      row.ondate_pt_brks_1000,
      row.cumm_pt_brks_1000,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.draw_tower === "TOTAL") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });

  currentRow += 2;

  // ===== SECTION 4: DRAW WISE DEFECT =====
  currentRow = addSectionTitle(ws, currentRow, "DRAW WISE DEFECT DATA", `Date: ${formattedDate}`, 9);

  const defectHeaders = [
    "Draw Tower",
    "BFD/1000", "Lumps/1000", "Airline/1000", "ND Value",
    "Cumm BFD/1000", "Cumm Lumps/1000", "Cumm Airline/1000", "Cumm ND Value",
  ];
  currentRow = addTableHeaders(ws, currentRow, defectHeaders);

  defectData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.draw_tower,
      row.ondate_bfd_1000, row.ondate_lumps_1000, row.ondate_airline_1000, row.ondate_nd_value,
      row.cumm_bfd_1000, row.cumm_lumps_1000, row.cumm_airline_1000, row.cumm_nd_value,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.draw_tower === "TOTAL") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });

  currentRow += 2;

  // ===== SECTION 5: OPTICAL PACKING REPORT =====
  currentRow = addSectionTitle(ws, currentRow, "OPTICAL & PACKING REPORT", `Date: ${formattedDate}`, 7);

  const packHeaders = [
    "Draw Tower",
    "Optical Yield %", "Pack (Km)", "Packing Yield %",
    "Cumm Optical %", "Cumm Pack (Km)", "Cumm Packing %",
  ];
  currentRow = addTableHeaders(ws, currentRow, packHeaders);

  packingData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.draw_tower,
      row.ondate_optical_yield, row.ondate_total_pack_km, row.ondate_packing_yield,
      row.cumm_optical_yield, row.cumm_total_pack_km, row.cumm_packing_yield,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.draw_tower === "TOTAL") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });

  currentRow += 2;

  // ===== SECTION 6: FG STOCK =====
  currentRow = addSectionTitle(ws, currentRow, "FG STOCK", `Current Stock Position`, 5);

  const fgHeaders = [
    "Category", "Opening", "On Date", "Cumulative", "Closing",
  ];
  currentRow = addTableHeaders(ws, currentRow, fgHeaders);

  fgStockData.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.category,
      row.opening,
      row.ondate,
      row.cumulative,
      row.closing,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.category === "TOTAL PRODUCTION") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });
}

// ==================== SHEET 3: OEE REPORT ====================
function buildOEESheet(workbook, formattedDate, date, oeeOnDate, oeeCumulative) {
  const ws = workbook.addWorksheet("OEE Report");

  ws.columns = [
    { width: 14 }, { width: 13 }, { width: 12 }, { width: 13 }, { width: 16 },
    { width: 16 }, { width: 12 }, { width: 15 }, { width: 14 }, { width: 14 },
    { width: 12 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 13 },
    { width: 12 }, { width: 12 },
  ];

  let currentRow = 1;

  // ===== OEE ON DATE =====
  currentRow = addSectionTitle(ws, currentRow, "OEE REPORT - ON DATE", `Date: ${formattedDate}`, 17);

  const oeeHeaders = [
    "Machine", "Rated Speed", "Total Time", "Production", "Planned Timeloss",
    "Planned Prod Time", "Downtime", "Operating Time", "Availability %", "Performance %",
    "Quality %", "OEE %", "Defect Kms", "Defect PT", "Defect DrRej",
    "Defect Fail", "Defect Rew",
  ];
  currentRow = addTableHeaders(ws, currentRow, oeeHeaders);

  oeeOnDate.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.machine, row.rated_speed, row.total_time, row.production, row.planned_timeloss,
      row.planned_prod_time, row.downtime, row.operating_time, row.availability, row.performance,
      row.quality, row.oee, row.defect_kms, row.defect_pt, row.defect_drrej,
      row.defect_fail, row.defect_rew,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.machine === "Total") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });

  currentRow += 3;

  // ===== OEE CUMULATIVE =====
  const firstDay = getFirstDayOfMonth(date);
  const yesterday = getYesterday(date);
  currentRow = addSectionTitle(
    ws,
    currentRow,
    "OEE REPORT - CUMULATIVE",
    `Period: ${formatDateDDMMYYYY(firstDay)} to ${formatDateDDMMYYYY(yesterday)}`,
    17
  );

  currentRow = addTableHeaders(ws, currentRow, oeeHeaders);

  oeeCumulative.forEach((row) => {
    const dataRow = ws.getRow(currentRow);
    const values = [
      row.machine, row.rated_speed, row.total_time, row.production, row.planned_timeloss,
      row.planned_prod_time, row.downtime, row.operating_time, row.availability, row.performance,
      row.quality, row.oee, row.defect_kms, row.defect_pt, row.defect_drrej,
      row.defect_fail, row.defect_rew,
    ];
    values.forEach((val, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = { size: 10 };
      if (row.machine === "Total") {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });
    currentRow++;
  });
}

// ==================== HELPER FUNCTIONS ====================

function addSectionTitle(ws, row, title, subtitle, colSpan) {
  // Title row
  ws.mergeCells(row, 1, row, colSpan);
  const titleCell = ws.getCell(row, 1);
  titleCell.value = title;
  titleCell.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(row).height = 25;
  row++;

  // Subtitle row
  ws.mergeCells(row, 1, row, colSpan);
  const subCell = ws.getCell(row, 1);
  subCell.value = subtitle;
  subCell.font = { size: 11, italic: true, color: { argb: "FF333333" } };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  row++;

  return row;
}

function addTableHeaders(ws, row, headers) {
  const headerRow = ws.getRow(row);
  headerRow.height = 22;

  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A5276" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = getThinBorder();
  });

  return row + 1;
}

function getThinBorder() {
  return {
    top: { style: "thin", color: { argb: "FF999999" } },
    bottom: { style: "thin", color: { argb: "FF999999" } },
    left: { style: "thin", color: { argb: "FF999999" } },
    right: { style: "thin", color: { argb: "FF999999" } },
  };
}

function formatDateDDMMYYYY(dateStr) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function getFirstDayOfMonth(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getYesterday(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
