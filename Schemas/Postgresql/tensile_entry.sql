CREATE TABLE tensile_entry(
    tensile_entry_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50),
    b_dynamic_tensile_strength DECIMAL(10,3),
    b_avg_strip_force DECIMAL(10,3),
    b_peak_strip_force DECIMAL(10,3)
    a_dynamic_tensile_strength DECIMAL(10,3),
    a_avg_strip_force DECIMAL(10,3),
    a_peak_strip_force DECIMAL(10,3),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)