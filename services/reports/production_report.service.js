import ExcelJS from "exceljs";
import pool from "../../db/postgres.js";

/**
 * The report covers the last complete day: yesterday in IST, as YYYY-MM-DD.
 * Derived in IST rather than from the server clock or UTC, so the answer does
 * not shift with the server timezone or the time of day the report is pulled.
 *
 * This is the single definition of "the report date" for every caller that does
 * not ask for a specific day.
 */
export const getDefaultReportDate = () =>
  new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/**
 * Generate Production Report Excel with 3 sheets
 * Sheet 1: Cover Page
 * Sheet 2: Yield / PT Proof / Optical Packing
 * Sheet 3: OEE Report (On Date + Cumulative)
 */
export const generateProductionReportS = async (reportDate) => {
  const date = reportDate || getDefaultReportDate();
  const formattedDate = formatDateDDMMYYYY(date);

  // Fetch all data in parallel
  const [yieldData, ptData, breakData, defectData, packingData, fgStockData, prodStagesData, fiberWipData, bobbinColorWipData, prodTrendData, oeeOnDate, oeeCumulative, drawSummaryData, towerDrawSummaryData, ptSummaryData, machinePtSummaryData] = await Promise.all([
    pool.query(`SELECT * FROM public.fn_draw_tower_yield_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_pt_proof_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_machine_wise_break_data($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_wise_defect($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_optical_packing_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_fg_stock()`),
    pool.query(`SELECT * FROM public.fn_production_stages($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_wip_fiber_report()`),
    pool.query(`SELECT * FROM public.fn_bobbin_color_wip_report()`),
    pool.query(`SELECT * FROM public.fn_production_trend_summary($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_oee_report($1)`, [date]),
    pool.query(`SELECT * FROM public.fn_draw_tower_oee_report($1, $2)`, [getFirstDayOfMonth(date), date]),
    // Day-wise draw dashboard: 1st of the month up to the report date
    pool.query(
      `SELECT "day", month_plan, dt_prod, diff, dt_yield, dt_scrap, dt_brk_10k, bfd, lumps, airline, cd2
         FROM public.draw_summary_report
        WHERE "day" BETWEEN $1 AND $2
        ORDER BY "day"`,
      [getFirstDayOfMonth(date), date]
    ),
    pool.query(`SELECT * FROM public.fn_tower_draw_summary($1)`, [date]),
    // Day-wise PT dashboard: 1st of the month up to the report date
    pool.query(
      `SELECT "day", plan, pt_prod, diff, pt_yield, pt_scrap, pt_brk_1k, ftr, pt_full_length
         FROM public.pt_summary_report
        WHERE "day" BETWEEN $1 AND $2
        ORDER BY "day"`,
      [getFirstDayOfMonth(date), date]
    ),
    pool.query(`SELECT * FROM public.fn_machine_pt_summary($1)`, [date]),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MES System";
  workbook.created = new Date();

  // ========== SHEET 1: Cover Page ==========
  buildCoverSheet(workbook, formattedDate, prodStagesData.rows, fiberWipData.rows, bobbinColorWipData.rows, prodTrendData.rows);

  // ========== SHEET 2: Yield / PT / Break / Defect / Packing / FG Stock ==========
  buildProductionSheet(workbook, formattedDate, yieldData.rows, ptData.rows, breakData.rows, defectData.rows, packingData.rows, fgStockData.rows);

  // ========== SHEET 3: OEE Report ==========
  buildOEESheet(workbook, formattedDate, date, oeeOnDate.rows, oeeCumulative.rows);

  // ========== SHEET 4: Draw Dashboard (day-wise, month to report date) ==========
  buildDrawProdSheet(workbook, formattedDate, date, drawSummaryData.rows, towerDrawSummaryData.rows);

  // ========== SHEET 5: PT Dashboard (day-wise, month to report date) ==========
  buildPtProdSheet(workbook, formattedDate, date, ptSummaryData.rows, machinePtSummaryData.rows);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Prod_Report_${formattedDate.replace(/\./g, "-")}.xlsx`;

  return { buffer, fileName };
};

// ==================== SHEET 1: COVER PAGE ====================
function buildCoverSheet(workbook, formattedDate, prodStagesData, fiberWipData, bobbinColorWipData, prodTrendData) {
  const ws = workbook.addWorksheet("Production");

  // Set column widths
  ws.columns = [
    { width: 28 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 16 },
    { width: 18 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 14 }, { width: 10 },
  ];

  // Merge cells for header area
  ws.mergeCells("A3:K3");
  ws.mergeCells("A4:K4");
  ws.mergeCells("A5:K5");

  // Company Name
  const companyCell = ws.getCell("A3");
  companyCell.value = "West Coast Optilinks Hyderabad";
  companyCell.font = { size: 18, bold: true, color: { argb: "FF003399" } };
  companyCell.alignment = { horizontal: "center", vertical: "middle" };

  // Plant Name
  const plantCell = ws.getCell("A4");
  plantCell.value = "OPTICAL FIBRE PLANT - HYDERABAD";
  plantCell.font = { size: 18, bold: true, color: { argb: "FF003399" } };
  plantCell.alignment = { horizontal: "center", vertical: "middle" };

  // Report Title
  const titleCell = ws.getCell("A5");
  titleCell.value = `Daily Production Report For :${formattedDate}`;
  titleCell.font = { size: 18, bold: true, color: { argb: "FF003399" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Set row heights for better spacing
  ws.getRow(3).height = 30;
  ws.getRow(4).height = 30;
  ws.getRow(5).height = 30;

  // ===== PRODUCTION STAGES TABLE =====
  let currentRow = 7;

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

  // ===== FIBER WIP TABLE =====
  currentRow = addDynamicTable(ws, currentRow, "FIBER WIP", `Date: ${formattedDate}`, fiberWipData);

  // ===== BOBBIN COLOR WIP TABLE =====
  currentRow = addDynamicTable(ws, currentRow, "FG STOCK", `Date: ${formattedDate}`, bobbinColorWipData);

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
  currentRow = addSectionTitle(
    ws,
    currentRow,
    "OEE REPORT - CUMULATIVE",
    `Period: ${formatDateDDMMYYYY(firstDay)} to ${formatDateDDMMYYYY(date)}`,
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

// ==================== SHEET 4: DRAW DASHBOARD ====================
function buildDrawProdSheet(workbook, formattedDate, date, drawSummaryData, towerDrawSummaryData) {
  const ws = workbook.addWorksheet("Draw_Prod");

  ws.columns = [
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 },
    { width: 12 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
  ];

  const firstDay = getFirstDayOfMonth(date);
  let currentRow = addSectionTitle(
    ws,
    1,
    "DRAW DASHBOARD",
    `Day wise: ${formatDateDDMMYYYY(firstDay)} to ${formattedDate}`,
    11
  );

  const drawHeaders = [
    "Date", "Month Plan", "DT Prod", "Diff", "DT Yield",
    "DT Scrap", "DT Brk/10K", "BFD", "Lumps", "Airline", "CD2",
  ];
  currentRow = addTableHeaders(ws, currentRow, drawHeaders);

  drawSummaryData.forEach((row) => {
    writeNumericRow(ws, currentRow, [
      row.day ? formatDateDDMMYYYY(row.day) : "-",
      row.month_plan, row.dt_prod, row.diff, row.dt_yield,
      row.dt_scrap, row.dt_brk_10k, row.bfd, row.lumps, row.airline, row.cd2,
    ]);
    currentRow++;
  });

  currentRow += 2;

  // ===== TOWER WISE DRAW SUMMARY =====
  currentRow = addSectionTitle(
    ws,
    currentRow,
    "TOWER WISE DRAW SUMMARY",
    `Date: ${formattedDate}`,
    5
  );

  const towerHeaders = ["DT Machine", "Total DT", "DT OK", "DT Break", "Draw Scrap"];
  currentRow = addTableHeaders(ws, currentRow, towerHeaders);

  towerDrawSummaryData.forEach((row) => {
    writeNumericRow(
      ws,
      currentRow,
      [row.dt_machine, row.total_dt, row.dt_ok, row.dt_break, row.draw_scrap],
      { isTotal: /^\s*total/i.test(String(row.dt_machine ?? "")) }
    );
    currentRow++;
  });

  return currentRow;
}

// ==================== SHEET 5: PT DASHBOARD ====================
function buildPtProdSheet(workbook, formattedDate, date, ptSummaryData, machinePtSummaryData) {
  const ws = workbook.addWorksheet("PT_Prod");

  ws.columns = [
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 },
    { width: 12 }, { width: 14 }, { width: 10 }, { width: 16 },
  ];

  const firstDay = getFirstDayOfMonth(date);
  let currentRow = addSectionTitle(
    ws,
    1,
    "PT DASHBOARD",
    `Day wise: ${formatDateDDMMYYYY(firstDay)} to ${formattedDate}`,
    9
  );

  const ptHeaders = [
    "Date", "Plan", "PT Prod", "Diff", "PT Yield",
    "PT Scrap", "PT Brk/1K", "FTR", "PT Full Length",
  ];
  currentRow = addTableHeaders(ws, currentRow, ptHeaders);

  ptSummaryData.forEach((row) => {
    writeNumericRow(ws, currentRow, [
      row.day ? formatDateDDMMYYYY(row.day) : "-",
      row.plan, row.pt_prod, row.diff, row.pt_yield,
      row.pt_scrap, row.pt_brk_1k, row.ftr, row.pt_full_length,
    ]);
    currentRow++;
  });

  if (ptSummaryData.length > 0) {
    const total = (key) => roundTo3(sumColumn(ptSummaryData, key));
    const totalProd = sumColumn(ptSummaryData, "pt_prod");
    const totalScrap = sumColumn(ptSummaryData, "pt_scrap");

    // pt_yield and ftr are percentages, so they are recomputed from the totals
    // the same way fn_insert_pt_summary_report derives them per day. Adding or
    // averaging the daily percentages would give the wrong answer whenever
    // daily volumes differ.
    const yieldPct = totalProd > 0 ? roundTo3(((totalProd - totalScrap) / totalProd) * 100) : null;

    // pt_brk_1k is a ratio over the day's break count, and the break count is
    // not stored in pt_summary_report, so no correct total can be derived here.
    writeNumericRow(
      ws,
      currentRow,
      [
        "Total",
        total("plan"), roundTo3(totalProd), total("diff"), yieldPct,
        roundTo3(totalScrap), null, yieldPct, total("pt_full_length"),
      ],
      { isTotal: true }
    );
    currentRow++;
  }

  currentRow += 2;

  // ===== MACHINE WISE PT SUMMARY =====
  currentRow = addSectionTitle(
    ws,
    currentRow,
    "MACHINE WISE PT SUMMARY",
    `Date: ${formattedDate}`,
    5
  );

  const machineHeaders = ["PT Machine", "Total PT", "PT OK", "PT Break", "PT Scrap"];
  currentRow = addTableHeaders(ws, currentRow, machineHeaders);

  machinePtSummaryData.forEach((row) => {
    writeNumericRow(
      ws,
      currentRow,
      [row.pt_machine, row.total_pt, row.pt_ok, row.pt_break, row.pt_scrap],
      { isTotal: /^\s*total/i.test(String(row.pt_machine ?? "")) }
    );
    currentRow++;
  });

  return currentRow;
}

/** Sum one column across rows, treating null/blank/non-numeric as 0. */
function sumColumn(rows, key) {
  return rows.reduce((acc, row) => {
    const num = Number(row[key]);
    return acc + (Number.isFinite(num) ? num : 0);
  }, 0);
}

/** Round to 3 decimals, matching the precision stored in the summary tables. */
function roundTo3(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.round(value * 1000) / 1000;
}

/**
 * Write one data row, coercing pg's numeric-as-string values (every column but
 * the first) into real numbers so the sheet can be summed, sorted and charted.
 */
function writeNumericRow(ws, rowIndex, values, { isTotal = false } = {}) {
  const dataRow = ws.getRow(rowIndex);

  values.forEach((val, idx) => {
    const cell = dataRow.getCell(idx + 1);
    const num = idx > 0 && typeof val === "string" && val.trim() !== "" && !isNaN(val) ? Number(val) : val;
    cell.value = num !== null && num !== undefined && num !== "" ? num : "-";
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = getThinBorder();
    cell.font = isTotal ? { size: 10, bold: true } : { size: 10 };
    if (isTotal) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
    }
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

/**
 * Render a table whose columns are taken from whatever the SQL function returns,
 * in order, so no hand-written column map can drift from the function.
 * Returns the next free row (with the usual 2-row gap). Renders nothing for no rows.
 */
function addDynamicTable(ws, row, title, subtitle, data) {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  if (columns.length === 0) return row;

  let currentRow = addSectionTitle(ws, row, title, subtitle, columns.length);
  currentRow = addTableHeaders(ws, currentRow, columns.map(toHeaderLabel));

  data.forEach((dataItem) => {
    const dataRow = ws.getRow(currentRow);
    const isTotal = /^\s*total/i.test(String(dataItem[columns[0]] ?? ""));

    columns.forEach((key, idx) => {
      const val = dataItem[key];
      const cell = dataRow.getCell(idx + 1);
      cell.value = val !== null && val !== undefined && val !== "" ? val : "-";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = getThinBorder();
      cell.font = isTotal ? { size: 10, bold: true } : { size: 10 };
      if (isTotal) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
      }
    });

    // First column left-aligned, like the stages table
    dataRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    currentRow++;
  });

  return currentRow + 2;
}

/** Turn a SQL column name into a readable header: "wip_km" -> "WIP Km" */
function toHeaderLabel(columnName) {
  const special = { wip: "WIP", km: "Km", pct: "%", qty: "Qty", no: "No", id: "ID", fg: "FG", pt: "PT", qc: "QC" };
  return String(columnName)
    .split("_")
    .filter(Boolean)
    .map((word) => special[word.toLowerCase()] || word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
