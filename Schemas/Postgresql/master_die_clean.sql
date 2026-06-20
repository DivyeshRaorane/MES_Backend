-- Master table for Die Clean options (dropdown)

CREATE TABLE master_die_clean (
    die_clean_id SERIAL PRIMARY KEY,
    die_clean_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
