-- Master table for Rewinding/Colouring Operators (dropdown)

CREATE TABLE master_rew_operator (
    rew_operator_id SERIAL PRIMARY KEY,
    operator_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
