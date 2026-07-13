CREATE TABLE f_curl_history (
    id SERIAL PRIMARY KEY,
    fiber_id VARCHAR(100),
    length NUMERIC,
    measurement_date DATE,
    measurement_time TIME,
    fiber_curl_top NUMERIC,
    fiber_curl_bottom NUMERIC,
    Operator VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);