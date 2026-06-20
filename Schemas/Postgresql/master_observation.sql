-- Master table for Observations (dropdown: Winding Observation, SCR Observation)

CREATE TABLE master_observation (
    observation_id SERIAL PRIMARY KEY,
    observation_name VARCHAR(100) NOT NULL,
    observation_type VARCHAR(30) NOT NULL CHECK (observation_type IN ('winding', 'scr')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
