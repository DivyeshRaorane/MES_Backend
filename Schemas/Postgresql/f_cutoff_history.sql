CREATE TABLE f_cutoff_history (
    id SERIAL PRIMARY KEY,
    fiber_id VARCHAR(100),
    length NUMERIC,
    measurement_date DATE,
    measurement_time TIME,
    cut_off_top NUMERIC,
    cut_off_bottom NUMERIC,
    Operator VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);