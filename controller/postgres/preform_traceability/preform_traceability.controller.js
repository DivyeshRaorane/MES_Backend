import ExcelJS from "exceljs";
import { getPreformTraceabilityS } from "../../../services/preform_traceability/preform_traceability.service.js";

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };

const toHeader = (key) =>
    key
        .split("_")
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(" ");

/**
 * JSON: GET /api/preform-traceability?bobbin_no=XXXX
 */
export const getPreformTraceabilityC = async (req, res) => {
    try {
        const bobbinNo = req.query.bobbin_no;
        if (!bobbinNo) {
            return res.status(400).json({ success: false, message: "bobbin_no is required" });
        }
        const result = await getPreformTraceabilityS(bobbinNo);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Preform traceability error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Excel: GET /api/preform-traceability/export?bobbin_no=XXXX
 */
export const exportPreformTraceabilityC = async (req, res) => {
    try {
        const bobbinNo = req.query.bobbin_no;
        if (!bobbinNo) {
            return res.status(400).json({ success: false, message: "bobbin_no is required" });
        }

        const { preform_id, spool_ids, bobbins, qc_entries } = await getPreformTraceabilityS(bobbinNo);

        if (!preform_id) {
            return res.status(404).json({ success: false, message: `No preform found for bobbin ${bobbinNo}` });
        }

        // Bobbin summary columns, in the requested order
        const bobbinCols = [
            { key: "preform_id", header: "Preform ID" },
            { key: "spool_id", header: "Spool ID" },
            { key: "fid", header: "FID" },
            { key: "bobbin_no", header: "Bobbin No" },
            { key: "product_type", header: "Product Type" },
            { key: "pt_length", header: "PT Length" },
            { key: "optical_length", header: "Optical Length" },
            { key: "temp_grade", header: "Temp Grade" },
            { key: "final_grade", header: "Final Grade" },
            { key: "tower_no", header: "Tower No" },
            { key: "t_machine_no", header: "PT Machine No" },
        ];

        // Index QC rows by bobbin_no so each bobbin row carries its own QC data.
        // Skip qc columns that duplicate the summary columns to avoid repetition.
        const qcDuplicateKeys = new Set(["bobbin_no", "product_type", "temp_grade", "final_grade", "optical_length"]);
        const qcMap = new Map();
        qc_entries.forEach((row) => { qcMap.set(row.bobbin_no, row); });
        const qcKeys = (qc_entries.length > 0 ? Object.keys(qc_entries[0]) : []).filter((k) => !qcDuplicateKeys.has(k));

        // Final ordered column list: bobbin summary first, then QC data
        const columns = [
            ...bobbinCols,
            ...qcKeys.map((k) => ({ key: `qc_${k}`, header: toHeader(k) })),
        ];

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "MES System";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Preform Traceability");

        // Title
        sheet.mergeCells(1, 1, 1, columns.length);
        const titleCell = sheet.getCell("A1");
        titleCell.value = `Preform Traceability - Bobbin ${bobbinNo}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: "center" };

        // Meta line
        sheet.mergeCells(2, 1, 2, columns.length);
        sheet.getCell("A2").value =
            `Preform: ${preform_id} | Spools: ${spool_ids.join(", ") || "-"} | Bobbins: ${bobbins.length} | Generated: ${new Date().toISOString().split("T")[0]}`;
        sheet.getCell("A2").font = { size: 9, italic: true };

        // Header row
        const headerRow = sheet.getRow(4);
        columns.forEach((col, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = col.header;
            cell.font = HEADER_FONT;
            cell.fill = HEADER_FILL;
        });

        // Data rows: one row per bobbin, with its QC data appended
        bobbins.forEach((bobbin, idx) => {
            const qc = qcMap.get(bobbin.bobbin_no) || {};
            const excelRow = sheet.getRow(5 + idx);
            columns.forEach((col, i) => {
                let val;
                if (col.key.startsWith("qc_")) {
                    val = qc[col.key.slice(3)];
                } else {
                    val = bobbin[col.key];
                }
                excelRow.getCell(i + 1).value = val instanceof Date ? val.toISOString() : (val ?? "");
            });
            if (idx % 2 === 1) {
                excelRow.eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
                });
            }
        });

        sheet.columns.forEach((col) => { col.width = 16; });
        sheet.views = [{ state: "frozen", ySplit: 4 }];

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=preform_traceability_${bobbinNo}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Preform traceability export error:", error);
        res.status(500).json({ success: false, message: "Export failed" });
    }
};
