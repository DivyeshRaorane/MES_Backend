-- Master table for Working Shifts (dropdown)

CREATE TABLE shifts(
shift_id SERIAL PRIMARY KEY,
shift_name VARCHAR(20) NOT NULL,
shift_start_time TIME NOT NULL,
shift_end_time TIME NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
