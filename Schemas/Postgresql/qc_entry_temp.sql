CREATE TABLE qc_entry_temp(
    bobbin_no VARCHAR(20)  PRIMARY KEY,
    bobbin_fid VARCHAR(50)  UNIQUE NOT NULL,
    matcode VARCHAR(50),
    avg_lsa_atn_1310 DECIMAL(10,3),
    avg_lsa_atn_1550 DECIMAL(10,3),
    avg_lsa_atn_1625 DECIMAL(10,3),
    avg_lsa_atn_1383 DECIMAL(10,3),

    max_lsa_atn_1310 DECIMAL(10,3),
    max_lsa_atn_1550 DECIMAL(10,3),
    max_lsa_atn_1625 DECIMAL(10,3),
    max_lsa_atn_1383 DECIMAL(10,3),

    min_lsa_atn_1310 DECIMAL(10,3),
    min_lsa_atn_1550 DECIMAL(10,3),
    min_lsa_atn_1625 DECIMAL(10,3),
    min_lsa_atn_1383 DECIMAL(10,3),

    atn_1310_top DECIMAL(10,3),
    atn_1550_top DECIMAL(10,3),
    atn_1625_top DECIMAL(10,3),
    atn_1383_top DECIMAL(10,3),

    atn_1310_bottom DECIMAL(10,3),
    atn_1550_bottom DECIMAL(10,3),
    atn_1625_bottom DECIMAL(10,3),
    atn_1383_bottom DECIMAL(10,3),

    max_atn_1310_top DECIMAL(10,3),
    max_atn_1550_top DECIMAL(10,3),
    max_atn_1625_top DECIMAL(10,3),
    max_atn_1383_top DECIMAL(10,3),

    max_atn_1310_bottom DECIMAL(10,3),
    max_atn_1550_bottom DECIMAL(10,3),
    max_atn_1625_bottom DECIMAL(10,3),
    max_atn_1383_bottom DECIMAL(10,3),

    max_tb_1310 DECIMAL(10,3),
    max_tb_1550 DECIMAL(10,3),
    max_tb_1625 DECIMAL(10,3),
    max_tb_1383 DECIMAL(10,3),

    atn_1310_tb DECIMAL(10,3),
    atn_1550_tb DECIMAL(10,3),
    atn_1625_tb DECIMAL(10,3),
    atn_1383_tb DECIMAL(10,3),

    atn_uniformity_1310 DECIMAL(10,3),
    atn_uniformity_1550 DECIMAL(10,3),
    atn_uniformity_1625 DECIMAL(10,3),
    atn_uniformity_1383 DECIMAL(10,3),

   mfd_uniformity_1310 DECIMAL(10,3),
   mfd_uniformity_1550 DECIMAL(10,3),
   mfd_uniformity_1625 DECIMAL(10,3),
   mfd_uniformity_1383 DECIMAL(10,3),

   

   step_1310_size DECIMAL(10,3),
   step_1550_size DECIMAL(10,3),
   step_1625_size DECIMAL(10,3),
   step_1383_size DECIMAL(10,3),

   spike_1310_size DECIMAL(10,3),
   spike_1550_size DECIMAL(10,3),
   spike_1625_size DECIMAL(10,3),
   spike_1383_size DECIMAL(10,3),


   spec_1310 DECIMAL(10,3),
   spec_1550 DECIMAL(10,3),
   spec_1285_1330 DECIMAL(10,3),

   mfd_1310_top DECIMAL(10,3),
   mfd_1310_bottom DECIMAL(10,3),

   mfd_1550_top DECIMAL(10,3),
   mfd_1550_bottom DECIMAL(10,3),

   effective_area_1310 DECIMAL(10,3),
   effective_area_1550 DECIMAL(10,3),

   cut_off_top DECIMAL(10,3),
   cut_off_bottom DECIMAL(10,3),

   cable_cut_off DECIMAL(10,3),

   mac_value DECIMAL(10,3),

   clad_dia_top DECIMAL(10,3),
   clad_dia_bottom DECIMAL(10,3),

   core_clad_concentricity_top DECIMAL(10,3),
   core_clad_concentricity_bottom DECIMAL(10,3),

   clad_ovality_top DECIMAL(10,3),
   clad_ovality_bottom DECIMAL(10,3),

   core_dia_top DECIMAL(10,3),
   core_dia_bottom DECIMAL(10,3),

   core_ovality_top DECIMAL(10,3),
   core_ovality_bottom DECIMAL(10,3),

   primary_coating_dia_top DECIMAL(10,3),
   primary_coating_dia_bottom DECIMAL(10,3),

   secondary_coating_dia_top DECIMAL(10,3),
   secondary_coating_dia_bottom DECIMAL(10,3),

   primary_coating_concentricity_top DECIMAL(10,3),
   primary_coating_concentricity_bottom DECIMAL(10,3),  

   secondary_coating_concentricity_top DECIMAL(10,3),
   secondary_coating_concentricity_bottom DECIMAL(10,3),  

   coating_ovality_top DECIMAL(10,3),
   coating_ovality_bottom DECIMAL(10,3),

   fiber_curl_top DECIMAL(10,3),
   fiber_curl_bottom DECIMAL(10,3),

   curl_defection_top DECIMAL(10,3),
   curl_defection_bottom DECIMAL(10,3),


   zero_disp_wave DECIMAL(10,3),
   slope_zero_disp DECIMAL(10,3),
   disp_1550 DECIMAL(10,3), 
   disp_1285_1330 DECIMAL(10,3), 
   disp_1270_1340 DECIMAL(10,3),
   disp_1575 DECIMAL(10,3),
   cd_1460 DECIMAL(10,3),
   disp_1625 DECIMAL(10,3),
   disp_1570 DECIMAL(10,3),
   disp_1260 DECIMAL(10,3),
   pmd_1310 DECIMAL(10,3),
   pmd_1550 DECIMAL(10,3),
   disp_slope DECIMAL(10,3),



   m_100T_50mm_1550 DECIMAL(10,3),
   m_100T_50mm_1310 DECIMAL(10,3),
   m_100T_50mm_1625 DECIMAL(10,3),
   
   m_100T_60mm_1550 DECIMAL(10,3),
   m_100T_60mm_1310 DECIMAL(10,3), 
   m_100T_60mm_1625 DECIMAL(10,3),
   
   m_1T_32mm_1550 DECIMAL(10,3),
   m_1T_32mm_1310 DECIMAL(10,3),
   m_1T_32mm_1625 DECIMAL(10,3),
   
   m_10T_30mm_1550 DECIMAL(10,3),
   m_10T_30mm_1310 DECIMAL(10,3),
   m_10T_30mm_1625 DECIMAL(10,3),
   
   m_1T_20mm_1550 DECIMAL(10,3),
   m_1T_20mm_1310 DECIMAL(10,3),
   m_1T_20mm_1625 DECIMAL(10,3),

   m_1T_15mm_1550 DECIMAL(10,3),
   m_1T_15mm_1310 DECIMAL(10,3),
   m_1T_15mm_1625 DECIMAL(10,3),

   m_1T_10mm_1550 DECIMAL(10,3),
   m_1T_10mm_1310 DECIMAL(10,3),
   m_1T_10mm_1625 DECIMAL(10,3),

   temp_grade VARCHAR(10),
   final_grade VARCHAR(10)




)