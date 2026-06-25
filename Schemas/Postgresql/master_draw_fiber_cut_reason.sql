CREATE TABLE d_fiber_cut_reasons(
    dfcr_id SERIAL PRIMARY KEY,
    dfcr_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)