-- Master table for Process Types (dropdown)

CREATE TABLE master_process_type (
    process_type_id SERIAL PRIMARY KEY,
    process_type_name VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'A', 'B'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
