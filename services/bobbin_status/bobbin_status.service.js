import pool from "../../db/postgres.js";

/**
 * Trace a bobbin through the production/QC pipeline and return an ordered list
 * of stages for a frontend status bar.
 *
 * Flow:
 *  1. Must exist in bobbin_entries. If not -> stop (exists: false).
 *  2. Look it up in pt_entry / coloring_entry / rewinding_entry.
 *  3. Must exist in qc_entry_temp to continue. If not -> stop.
 *  4. Based on temp_grade / final_grade (from bobbin_entries) and qc_entry /
 *     otdr_test_date, derive OTDR + QC.
 *  5. When final_grade is set (or temp_grade set and present in both qc tables),
 *     read the downstream flags PV / D2 Issue / D2 / Stock Transfer from
 *     bobbin_entries.
 */
export const getBobbinStatusS = async (bobbin_no) => {
    if (!bobbin_no) {
        return { success: false, message: "bobbin_no is required." };
    }

    // ---- Step 1: bobbin_entries ------------------------------------------
    const beResult = await pool.query(
        `SELECT bobbin_no, is_pv, d2_issue, is_d2, is_qc_out, temp_grade, final_grade, dispatch_status
         FROM bobbin_entries
         WHERE bobbin_no = $1
         LIMIT 1`,
        [bobbin_no]
    );

    if (beResult.rows.length === 0) {
        return {
            success: true,
            bobbin_no,
            exists: false,
            message: "Bobbin not found in bobbin_entries.",
            stages: [],
        };
    }

    const bobbin = beResult.rows[0];

    const hasTempGrade =
        bobbin.temp_grade !== null && String(bobbin.temp_grade).trim() !== "";
    const hasFinalGrade =
        bobbin.final_grade !== null && String(bobbin.final_grade).trim() !== "";

    // Running status map. Only keys set to true will be reported as done.
    const status = {
        pt: false,
        coloring: false,
        rewinding: false,
        otdr: false,
        qc: false,
        pv: false,
        d2_issue: false,
        d2: false,
        stock_transfer: false,
    };

    // ---- Step 2: PT / Coloring / Rewinding -------------------------------
    const [ptRes, colRes, rewRes] = await Promise.all([
        pool.query(`SELECT 1 FROM pt_entry WHERE bobbin_no = $1 LIMIT 1`, [bobbin_no]),
        pool.query(`SELECT 1 FROM coloring_entry WHERE bobbin_no = $1 LIMIT 1`, [bobbin_no]),
        pool.query(`SELECT 1 FROM rewinding_entry WHERE bobbin_no = $1 LIMIT 1`, [bobbin_no]),
    ]);

    status.pt = ptRes.rows.length > 0;
    status.coloring = colRes.rows.length > 0;
    status.rewinding = rewRes.rows.length > 0;

    // ---- Step 3: qc_entry_temp gate --------------------------------------
    const qcTempRes = await pool.query(
        `SELECT otdr_test_date FROM qc_entry_temp WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );
    const inQcTemp = qcTempRes.rows.length > 0;

    if (!inQcTemp) {
        // Stop here — no QC-temp record yet.
        return buildResponse(bobbin_no, bobbin, status);
    }

    const otdrTestDate = qcTempRes.rows[0].otdr_test_date;
    const hasOtdrTestDate =
        otdrTestDate !== null && String(otdrTestDate).trim() !== "";

    // Is the bobbin also present in the final qc_entry table?
    const qcEntryRes = await pool.query(
        `SELECT 1 FROM qc_entry WHERE bobbin_no = $1 LIMIT 1`,
        [bobbin_no]
    );
    const inQcEntry = qcEntryRes.rows.length > 0;

    // ---- Step 4: Derive OTDR / QC ----------------------------------------
    if (hasTempGrade && !hasFinalGrade) {
        // temp grade present but final grade not yet assigned.
        if (inQcEntry) {
            status.otdr = true;
            status.qc = true;
        }
    } else if (!hasTempGrade) {
        // No temp grade -> OTDR only, driven by otdr_test_date.
        if (hasOtdrTestDate) {
            status.otdr = true;
        }
    }

    // ---- Step 5: Downstream flags ----------------------------------------
    // Eligible when final grade exists, OR temp grade exists and the bobbin is
    // present in BOTH qc_entry_temp and qc_entry.
    const downstreamEligible =
        hasFinalGrade || (hasTempGrade && inQcTemp && inQcEntry);

    if (downstreamEligible) {
        // When we reach downstream, QC/OTDR are effectively complete too.
        status.qc = true;
        status.otdr = true;

        status.pv = bobbin.is_pv === true;
        status.d2_issue = bobbin.d2_issue === true;
        status.d2 = bobbin.is_d2 === true;
        status.stock_transfer = bobbin.is_qc_out === true;
    }

    return buildResponse(bobbin_no, bobbin, status);
};

/**
 * Shape the running status map into an ordered stage list for the status bar.
 */
function buildResponse(bobbin_no, bobbin, status) {
    const dispatchStatus = bobbin.dispatch_status ?? null;

    const stages = [
        { key: "pt", label: "PT Done", done: status.pt },
        { key: "coloring", label: "Coloring Done", done: status.coloring },
        { key: "rewinding", label: "Rewinding Done", done: status.rewinding },
        { key: "otdr", label: "OTDR", done: status.otdr },
        { key: "qc", label: "QC", done: status.qc },
        { key: "pv", label: "PV", done: status.pv },
        { key: "d2_issue", label: "D2 Issue", done: status.d2_issue },
        { key: "d2", label: "D2", done: status.d2 },
        { key: "stock_transfer", label: "Stock Transfer", done: status.stock_transfer },
        { key: "status", label: "Status", value: dispatchStatus },
    ];

    return {
        success: true,
        bobbin_no,
        exists: true,
        temp_grade: bobbin.temp_grade ?? null,
        final_grade: bobbin.final_grade ?? null,
        dispatch_status: dispatchStatus,
        stages,
    };
}
