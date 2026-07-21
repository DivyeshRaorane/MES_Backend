CREATE TABLE trh_entry(
trh_entry_id SERIAL PRIMARY KEY,
bobbin_no VARCHAR(50),
format_no VARCHAR(100),
gr_clause_no DECIMAL(10,3),
req_per_gr TEXT,
temp_hum_range VARCHAR(100),
testing_standard VARCHAR(100),
marker_a VARCHAR(50),
marker_b VARCHAR(50),

start_date DATE,
start_time TIME,
end_date DATE,
end_time TIME,
testing_standard VARCHAR(50),
fiber_length DECIMAL(10,3),
remark TEXT,
 
at_1310 DECIMAL(10,3),
at_1550 DECIMAL(10,3),
at_1625 DECIMAL(10,3),

logged_in_user VARCHAR(50),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)