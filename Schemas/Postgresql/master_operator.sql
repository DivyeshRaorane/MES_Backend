-- Master table for Loading Operators (dropdown in preform_allocation)

CREATE TABLE master_operator (
    operator_id SERIAL PRIMARY KEY,
    operator_name VARCHAR(100) NOT NULL,
    operator_type VARCHAR(30) NOT NULL DEFAULT 'loading' CHECK (operator_type IN ('loading', 'shift_incharge', 'die', 'ground', 'furnace')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
