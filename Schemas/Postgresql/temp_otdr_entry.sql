CREATE TABLE temp_otdr_entry(
    temp_otdr_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(20) NOT NULL
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
)