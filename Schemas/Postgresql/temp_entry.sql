CREATE TABLE temp_entry(
    temp_entry_id SERIAL PRIMARY KEY,
    tesing_standrd VARCHAR(100),
    format_no VARCHAR(50),
    gr_clause_no DECIMAL(10,3),
    req_per_gr TEXT,
    bobbin_no VARCHAR(50),
    fiber_length DECIMAL(10,3),
    marker_a VARCHAR(50),
    marker_b VARCHAR(50),
    start_date DATE,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    remark TEXT,
    result VARCHAR(10) CHECK(result IN ('pass', 'fail')), -- Fixed: Single quotes for string constants
    prepared_by VARCHAR(50),
    checked_by VARCHAR(50),
    physical_obs VARCHAR(100),

    at_1310 DECIMAL(10,3),
    at_1550 DECIMAL(10,3),
    at_1625 DECIMAL(10,3),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);