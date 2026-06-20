-- Master table for Preform Types (dropdown)
-- e.g. G652D, G657A1, etc.

CREATE TABLE master_preform_type (
    preform_type_id SERIAL PRIMARY KEY,
    preform_type_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),

    FOREIGN KEY (created_by) REFERENCES users(emp_id) 
);
