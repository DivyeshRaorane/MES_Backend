CREATE TABLE aat_day_entry(
    aat_day_entry_id SERIAL PRIMARY KEY,
    aat_entry_id INT REFERENCES aat_entry(aat_entry_id) ON DELETE CASCADE,
    bobbin_no VARCHAR(50),
    aat_date DATE,
    aat_day INT,
    at_1310 DECIMAL(10,3),
  at_1550 DECIMAL(10,3),
  at_1625 DECIMAL(10,3),
  logged_in_user VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)