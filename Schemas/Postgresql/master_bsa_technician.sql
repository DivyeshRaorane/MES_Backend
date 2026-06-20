-- Master table for BSA Technician (dropdown in pt_break_analysis)

CREATE TABLE master_bsa_technician (
    technician_id SERIAL PRIMARY KEY,
    technician_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
