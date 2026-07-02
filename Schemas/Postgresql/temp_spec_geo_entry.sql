CREATE TABLE temp_spec_geo_entry(
    spec_geo_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(20) NOT NULL,
    
    spec_1310 DECIMAL(10,3),
   spec_1550 DECIMAL(10,3),
   spec_1285_1330 DECIMAL(10,3),

   mfd_top DECIMAL(10,3),
   mfd_bottom DECIMAL(10,3),

   cut_off_top DECIMAL(10,3),
   cut_off_bottom DECIMAL(10,3),

   clad_dia_top DECIMAL(10,3),
   clad_dia_bottom DECIMAL(10,3),

   core_clad_concentricity_top(10,3),
   core_clad_concentricity_bottom(10,3),

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
   curl_defection_bottom DECIMAL(10,3)
)