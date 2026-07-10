CREATE TABLE trh_cyce_entry(
    trh_cyce_entry_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50),
    cycle_no INT,
    temperature INT,
    rh VARCHAR(20),
    trh_date DATE,
    trh_time TIME,
    at_1550 DECIMAL(10,3),
    at_1625 DECIMAL(10,3),

    tested_by VARCHAR(50),

logged_in_user VARCHAR(50),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)