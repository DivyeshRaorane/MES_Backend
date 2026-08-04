import pool from "../../db/postgres.js";

export const getFiberInformationS = async (search_value, search_type = "bobbin_no") => {
    // Step 1 — Find the Bobbin
    const whereClause = search_type === "fid" ? "b.fid = $1" : "b.bobbin_no = $1";

    const query = `
        SELECT
            b.*,
            q.product_type,
            q.final_grade AS qc_final_grade,
            q.temp_grade AS qc_temp_grade,
            q.optical_length,
            q.atn_1310_top, q.atn_1310_bottom,
            q.atn_1550_top, q.atn_1550_bottom,
            q.spec_1285_1330, q.spec_1310, q.spec_1550,
            q.mfd_1310_top, q.mfd_1310_bottom,
            q.cut_off_top, q.cut_off_bottom,
            q.clad_dia_top, q.clad_dia_bottom,
            q.core_clad_concentricity_top, q.core_clad_concentricity_bottom,
            q.clad_ovality_top, q.clad_ovality_bottom,
            q.core_dia_top, q.core_dia_bottom,
            q.core_ovality_top, q.core_ovality_bottom,
            q.primary_coating_dia_top, q.primary_coating_dia_bottom,
            q.primary_coating_concentricity_top, q.primary_coating_concentricity_bottom,
            q.secondary_coating_dia_top, q.secondary_coating_dia_bottom,
            q.secondary_coating_concentricity_top, q.secondary_coating_concentricity_bottom,
            q.coating_ovality_top, q.coating_ovality_bottom,
            q.zero_disp_wave, q.slope_zero_disp,
            q.disp_1550, q.disp_1285_1330, q.disp_1270_1340, q.disp_1575,
            q.pmd_1310, q.pmd_1550,
            q.fiber_curl_top, q.fiber_curl_bottom,
            q.mac_value,
            q.otdr_operator, q.otdr_machine
        FROM bobbin_entries b
        LEFT JOIN qc_entry q ON b.fid = q.bobbin_fid
        WHERE ${whereClause}
    `;

    const result = await pool.query(query, [search_value]);

    if (result.rows.length === 0) {
        return { success: false, status: 404, message: "Bobbin not found" };
    }

    const row = result.rows[0];

    // Step 2 — Check QC Out Status
    if (row.is_qc_out !== true) {
        return { success: true, data: { is_qc_out: false } };
    }

    // Step 4 — Dispatch Status
    const dispatch_status = row.dispatch_status === "PACKED" ? "Dispatched" : "Not Dispatched";

    // Step 5 — Build Response
    const data = {
        is_qc_out: true,
        // From bobbin_entries
        bobbin_no: row.bobbin_no,
        fid: row.fid,
        fiber_length: row.fiber_length,
        draw_date: row.draw_date,
        pt_date: row.pt_date,
        rewinding_status: row.rewinding_status,
        coloring_status: row.coloring_status,
        // From qc_entry
        product_type: row.product_type,
        final_grade: row.qc_final_grade,
        temp_grade: row.qc_temp_grade,
        optical_length: row.optical_length,
        atn_1310_top: row.atn_1310_top,
        atn_1310_bottom: row.atn_1310_bottom,
        atn_1550_top: row.atn_1550_top,
        atn_1550_bottom: row.atn_1550_bottom,
        spec_1285_1330: row.spec_1285_1330,
        spec_1310: row.spec_1310,
        spec_1550: row.spec_1550,
        mfd_1310_top: row.mfd_1310_top,
        mfd_1310_bottom: row.mfd_1310_bottom,
        cut_off_top: row.cut_off_top,
        cut_off_bottom: row.cut_off_bottom,
        clad_dia_top: row.clad_dia_top,
        clad_dia_bottom: row.clad_dia_bottom,
        core_clad_concentricity_top: row.core_clad_concentricity_top,
        core_clad_concentricity_bottom: row.core_clad_concentricity_bottom,
        clad_ovality_top: row.clad_ovality_top,
        clad_ovality_bottom: row.clad_ovality_bottom,
        core_dia_top: row.core_dia_top,
        core_dia_bottom: row.core_dia_bottom,
        core_ovality_top: row.core_ovality_top,
        core_ovality_bottom: row.core_ovality_bottom,
        primary_coating_dia_top: row.primary_coating_dia_top,
        primary_coating_dia_bottom: row.primary_coating_dia_bottom,
        primary_coating_concentricity_top: row.primary_coating_concentricity_top,
        primary_coating_concentricity_bottom: row.primary_coating_concentricity_bottom,
        secondary_coating_dia_top: row.secondary_coating_dia_top,
        secondary_coating_dia_bottom: row.secondary_coating_dia_bottom,
        secondary_coating_concentricity_top: row.secondary_coating_concentricity_top,
        secondary_coating_concentricity_bottom: row.secondary_coating_concentricity_bottom,
        coating_ovality_top: row.coating_ovality_top,
        coating_ovality_bottom: row.coating_ovality_bottom,
        zero_disp_wave: row.zero_disp_wave,
        slope_zero_disp: row.slope_zero_disp,
        disp_1550: row.disp_1550,
        disp_1285_1330: row.disp_1285_1330,
        disp_1270_1340: row.disp_1270_1340,
        disp_1575: row.disp_1575,
        pmd_1310: row.pmd_1310,
        pmd_1550: row.pmd_1550,
        fiber_curl_top: row.fiber_curl_top,
        fiber_curl_bottom: row.fiber_curl_bottom,
        mac_value: row.mac_value,
        // QC Remarks
        qc_remark: row.remark,
        nc_cause: row.nc_cause,
        otdr_operator: row.otdr_operator,
        otdr_machine: row.otdr_machine,
        // Dispatch
        dispatch_status: dispatch_status
    };

    return { success: true, data };
};
