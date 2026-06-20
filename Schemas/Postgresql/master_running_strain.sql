-- Master table for Running Strain (dropdown in pt_entry)

CREATE TABLE master_running_strain (
    running_strain_id SERIAL PRIMARY KEY,
    strain_name VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'Strain-A'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
