CREATE TABLE htha_entry(
htha_entry_id SERIAL PRIMARY KEY,
bobbin_no VARCHAR(50),
format_no VARCHAR(100),
gr_clause_no DECIMAL(10,3),
title VARCHAR(200),
req_per_gr TEXT,
testing_standard VARCHAR(50),
marker_a VARCHAR(50),
marker_b VARCHAR(50),
temp DECIMAL(10,3),
start_date DATE,
start_time TIME,
end_date DATE,
end_time TIME,
fiber_length DECIMAL(10,3),
remark TEXT,
tested_by VARCHAR(50),
checked_by VARCHAR(50),
 
at_1310 DECIMAL(10,3),
at_1550 DECIMAL(10,3),
at_1625 DECIMAL(10,3),

logged_in_user VARCHAR(50),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)