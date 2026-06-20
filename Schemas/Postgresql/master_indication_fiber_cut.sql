-- Master table for Indication Fiber Cut options (dropdown)

CREATE TABLE master_indication_fiber_cut (
    indication_id SERIAL PRIMARY KEY,
    indication_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
