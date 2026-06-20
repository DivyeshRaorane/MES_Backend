-- Master table for Rewinding Reason (dropdown in rewinding_entry)

CREATE TABLE master_rew_reason (
    rew_reason_id SERIAL PRIMARY KEY,
    reason_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
