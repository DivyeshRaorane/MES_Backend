CREATE TABLE bobbin_color(
    bobbin_color_id SERIAL PRIMARY KEY,
    bobbin_color_name VARCHAR(20) NOT NULL,
    is_disable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);