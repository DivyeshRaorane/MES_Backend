CREATE TABLE temp_entry(
    temp_entry_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50),
    bobbin_fid VARCHAR(50),
    preform_id VARCHAR(50),
    spool_id VARCHAR(50),
    tower_no INT,
    total_length DECIMAL(10,3),
    testing_standard VARCHAR(50),
    start_date DATE,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    remark TEXT,
    result VARCHAR(10) CHECK(result IN ("pass", "fail")),
    prepared_by VARCHAR(50),
    checked_by VARCHAR(50),
    physical_obs VARCHAR(100),

    at_1310 DECIMAL(10,3),
    at_1550 DECIMAL(10,3),
    at_1625 DECIMAL(10,3),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)