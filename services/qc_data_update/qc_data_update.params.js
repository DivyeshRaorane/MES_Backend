// Parameters of qc_entry_temp that can be controlled by the QC Data Update module.
//
// NOT updatable (never listed here): bobbin_no, bobbin_fid, product_type, reason, remark,
// status, is_rew_done, nc_cause, otdr_test_date, otdr_operator, otdr_machine,
// temp_grade, final_grade, optical_length.
//
// This list is the ONLY source of column names used in dynamic SQL (whitelist).
// Add a column here and it appears in the admin screen automatically
// (the service adds the matching column to qc_data_update_config on first use).
export const QC_UPDATABLE_PARAMS = [
  "avg_lsa_atn_1310", "avg_lsa_atn_1550", "avg_lsa_atn_1625", "avg_lsa_atn_1383",
  "max_lsa_atn_1310", "max_lsa_atn_1550", "max_lsa_atn_1625", "max_lsa_atn_1383",
  "min_lsa_atn_1310", "min_lsa_atn_1550", "min_lsa_atn_1625", "min_lsa_atn_1383",
  "atn_1310_top", "atn_1550_top", "atn_1625_top", "atn_1383_top",
  "atn_1310_bottom", "atn_1550_bottom", "atn_1625_bottom", "atn_1383_bottom",
  "max_atn_1310_top", "max_atn_1550_top", "max_atn_1625_top", "max_atn_1383_top",
  "max_atn_1310_bottom", "max_atn_1550_bottom", "max_atn_1625_bottom", "max_atn_1383_bottom",
  "max_tb_1310", "max_tb_1550", "max_tb_1625", "max_tb_1383",
  "atn_1310_tb", "atn_1550_tb", "atn_1625_tb", "atn_1383_tb",
  "atn_uniformity_1310", "atn_uniformity_1550", "atn_uniformity_1625", "atn_uniformity_1383",
  "mfd_uniformity_1310", "mfd_uniformity_1550", "mfd_uniformity_1625", "mfd_uniformity_1383",
  "step_1310_size", "step_1550_size", "step_1625_size", "step_1383_size",
  "spike_1310_size", "spike_1550_size", "spike_1625_size", "spike_1383_size",
  "spec_1310", "spec_1550", "spec_1285_1330",
  "mfd_1310_top", "mfd_1310_bottom", "mfd_1550_top", "mfd_1550_bottom",
  "effective_area_1310", "effective_area_1550",
  "cut_off_top", "cut_off_bottom", "cable_cut_off", "mac_value",
  "clad_dia_top", "clad_dia_bottom",
  "core_clad_concentricity_top", "core_clad_concentricity_bottom",
  "clad_ovality_top", "clad_ovality_bottom",
  "core_dia_top", "core_dia_bottom", "core_ovality_top", "core_ovality_bottom",
  "primary_coating_dia_top", "primary_coating_dia_bottom",
  "secondary_coating_dia_top", "secondary_coating_dia_bottom",
  "primary_coating_concentricity_top", "primary_coating_concentricity_bottom",
  "secondary_coating_concentricity_top", "secondary_coating_concentricity_bottom",
  "coating_ovality_top", "coating_ovality_bottom",
  "fiber_curl_top", "fiber_curl_bottom", "curl_defection_top", "curl_defection_bottom",
  "zero_disp_wave", "slope_zero_disp", "disp_1550", "disp_1285_1330", "disp_1270_1340",
  "disp_1575", "cd_1460", "disp_1625", "disp_1570", "disp_1260",
  "pmd_1310", "pmd_1550", "disp_slope",
  "m_100t_50mm_1550", "m_100t_50mm_1310", "m_100t_50mm_1625",
  "m_100t_60mm_1550", "m_100t_60mm_1310", "m_100t_60mm_1625",
  "m_1t_32mm_1550", "m_1t_32mm_1310", "m_1t_32mm_1625",
  "m_10t_30mm_1550", "m_10t_30mm_1310", "m_10t_30mm_1625",
  "m_1t_20mm_1550", "m_1t_20mm_1310", "m_1t_20mm_1625",
  "m_1t_15mm_1550", "m_1t_15mm_1310", "m_1t_15mm_1625",
  "m_1t_10mm_1550", "m_1t_10mm_1310", "m_1t_10mm_1625",
  "disp_1270_1360", "disp_1460", "disp_1490",
  "slope_1550", "slope_1290", "slope_1490",
  "spectral_date", "cd_date",
];

export const QC_CONFIG_TABLE = "qc_data_update_config";
