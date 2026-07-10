CREATE TABLE trh_entry(
trh_entry_id SERIAL PRIMARY KEY,
bobbin_no VARCHAR(50),
preform_id VARCHAR(50),
tower_no INT,
spool_id VARCHAR(50),
start_date DATE,
start_time TIME,
end_date DATE,
end_time TIME,
testing_standard VARCHAR(50),
total_length DECIMAL(10,3),
remark TEXT,
 
at_1310 DECIMAL(10,3),
at_1550 DECIMAL(10,3),
at_1625 DECIMAL(10,3),

logged_in_user VARCHAR(50),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)