-- Master table for PT Machine (dropdown in pt_allocation, pt_entry)

CREATE TABLE master_pt_machine (
    machine_id SERIAL PRIMARY KEY,
    machine_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
