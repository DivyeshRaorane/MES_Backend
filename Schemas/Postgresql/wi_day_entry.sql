CREATE TABLE wi_day_entry (
  wi_day_entry_id SERIAL PRIMARY KEY,
  wi_entry_id INT REFERENCES wi_entry(wi_entry_id) ON DELETE CASCADE,
  bobbin_no VARCHAR(50),
  wi_date DATE,
  wi_day INT,
  at_1310 DECIMAL(10,3),
  at_1550 DECIMAL(10,3),
  at_1625 DECIMAL(10,3),
  logged_in_user VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);