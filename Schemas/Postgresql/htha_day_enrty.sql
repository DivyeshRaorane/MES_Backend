CREATE TABLE htha_day_entry(
    htha_day_entry_id SERIAL PRIMARY KEY,
    htha_entry_id INT REFERENCES htha_entry(htha_entry_id) ON DELETE CASCADE, 
    bobbin_no VARCHAR(50),
    htha_date DATE,
    htha_day INT,
    at_1550 DECIMAL(10,3),
    at_1625 DECIMAL(10,3),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)