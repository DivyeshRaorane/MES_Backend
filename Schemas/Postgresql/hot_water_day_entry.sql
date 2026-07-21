CREATE TABLE hot_water_day_entry(
    hot_water_day_entry_id SERIAL PRIMARY KEY,
    hot_water_entry_id_entry_id INT REFERENCES hot_water_entry(hot_water_entry_id) ON DELETE CASCADE,
    bobbin_no VARCHAR(50),
    hw_date DATE,
    hw_day INT,
    at_1310 DECIMAL(10,3),
  at_1550 DECIMAL(10,3),
  at_1625 DECIMAL(10,3),
  logged_in_user VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)