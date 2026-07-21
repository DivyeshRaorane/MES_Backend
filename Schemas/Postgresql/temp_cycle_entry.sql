CREATE TABLE temp_cycle_entry(
    temp_cycle_id SERIAL PRIMARY KEY,
    temp_entry_id INT REFERENCES temp_entry(temp_entry_id) ON DELETE CASCADE, 
    bobbin_no VARCHAR(50),
    temperature INT,
    "date" DATE,
    "time" TIME,
    nm_1550 DECIMAL(10,3),
    nm_1625 DECIMAL(10,3),
    ch_nm_1550 DECIMAL(10,3),
    ch_nm_1625 DECIMAL(10,3),
    operator VARCHAR(50),
    remark TEXT,
    logged_in_user VARCHAR(50),              
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);