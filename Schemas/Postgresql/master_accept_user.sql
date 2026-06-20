-- Master table for Accepted By users (dropdown in preform_accept screen)

CREATE TABLE master_accept_user (
    accept_user_id SERIAL PRIMARY KEY,
    emp_name VARCHAR(100) NOT NULL,
    emp_contract VARCHAR(20) NOT NULL DEFAULT 'on_roll' CHECK (emp_contract IN ('on_roll', 'off_roll')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
