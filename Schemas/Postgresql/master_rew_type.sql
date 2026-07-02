-- Master table for Rewinding Type (dropdown in rewinding_entry)

CREATE TABLE master_rew_type (
    rew_type_id SERIAL PRIMARY KEY,
    rew_type_name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
