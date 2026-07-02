-- Master table for Main Break Type (dropdown in pt_break_analysis)

CREATE TABLE master_break_type (
    break_type_id SERIAL PRIMARY KEY,
    break_type_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
