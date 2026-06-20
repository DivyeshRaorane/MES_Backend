-- Master table for Payoff Vibration (dropdown in pt_entry)

CREATE TABLE master_payoff_vibration (
    payoff_vibration_id SERIAL PRIMARY KEY,
    vibration_name VARCHAR(50) NOT NULL UNIQUE,  -- e.g. 'Normal', 'High'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
