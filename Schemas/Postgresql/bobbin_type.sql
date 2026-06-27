CREATE TABLE bobbin_type(
    bobbin_type_id SERIAL PRIMARY KEY,
    bobbin_type_name VARCHAR(20) NOT NULL,
    is_disable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);