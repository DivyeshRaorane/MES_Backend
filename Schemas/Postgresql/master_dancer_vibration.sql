-- Master table for Dancer Vibration (dropdown in pt_entry)

CREATE TABLE master_dancer_vibration (
    vibration_id SERIAL PRIMARY KEY,
    vibration_name VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'Normal', 'High'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
