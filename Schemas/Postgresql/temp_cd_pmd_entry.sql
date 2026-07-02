CREATE TABLE temp_cd_pmd_entry(
    cd_pmd_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(20) NOT NULL,

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
)