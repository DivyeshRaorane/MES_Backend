CREATE TABLE dyanmic_fartique_speed(
    dyanmic_fartique_speed_id SERIAL PRIMARY KEY,
    dynamic_fartique_id INT REFERENCES dyanmic_fartique(dynamic_fartique_id) ON DELETE CASCADE,
    bobbin_no VARCHAR(50),
    fiber_type VARCHAR(50) CHECK (fiber_type IN ("Unaged Fiber", "Aged Fiber")),
    speed DECIMAL(10,3),
    ts_kg DECIMAL(10,3),
    ext_mm DECIMAL(10,3),
    gpa DECIMAL(10,3),
    time_min DECIMAL(10,3),
    stress_rate DECIMAL(10,3),
    ln_stress_rate DECIMAL(10,3),
    ln_stress DECIMAL(10,3),
    slope DECIMAL(10,3),
    n_value DECIMAL(10,3),

logged_in_user VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)