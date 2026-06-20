-- Master table for Undefined Reason options (dropdown)

CREATE TABLE master_undefined_reason (
    reason_id SERIAL PRIMARY KEY,
    reason_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
