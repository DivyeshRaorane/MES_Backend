-- Master table for Working Shifts (dropdown)

CREATE TABLE master_shift (
    shift_id SERIAL PRIMARY KEY,
    shift_name VARCHAR(10) NOT NULL UNIQUE,  -- e.g. 'A', 'B', 'C'
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
