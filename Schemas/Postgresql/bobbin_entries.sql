CREATE TABLE bobbin_entries(
    fid_create_id SERIAL PRIMARY KEY,
    fid VARCHAR(20) NOT NULL UNIQUE,
    spool_id VARCHAR(20) NOT NULL,
    bobbin_no VARCHAR(2) NOT NULL,
    tower_no INT,
	pt_machine_no INT,
    fiber_length DECIMAL(10,2) NOT NULL,
    drawn_date DATE NOT NULL,
    pt_date DATE NOT NULL,
    drawn_length DECIMAL(10,2),
    operator VARCHAR(50),

    logged_in_user INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);