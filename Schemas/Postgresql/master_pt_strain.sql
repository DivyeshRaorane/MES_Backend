-- Master table for PT Strain (dropdown in pt_allocation)

CREATE TABLE master_pt_strain (
    strain_id SERIAL PRIMARY KEY,
    strain_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
