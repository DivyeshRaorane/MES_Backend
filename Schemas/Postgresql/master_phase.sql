-- Master table for Phase (dropdown in timeloss entry)

CREATE TABLE master_phase (
    phase_id SERIAL PRIMARY KEY,
    phase_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
