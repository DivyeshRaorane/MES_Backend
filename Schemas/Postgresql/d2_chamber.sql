CREATE TABLE d2_chamber (
    d2_chamber_id SERIAL PRIMARY KEY,
    d2_chamber_no INT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);