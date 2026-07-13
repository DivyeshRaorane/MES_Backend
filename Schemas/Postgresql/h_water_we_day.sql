CREATE TABLE h_water_we_day_entry(
    h_water_we_day_entry_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50),
    h_water_we_day_entry_date DATE,
    h_water_we_day_entry_day INT,
    at_1550 DECIMAL(10,3),
    at_1625 DECIMAL(10,3),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)