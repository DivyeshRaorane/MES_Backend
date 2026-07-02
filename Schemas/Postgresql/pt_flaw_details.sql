CREATE TABLE pt_flaw_details(
    pt_flaw_id SERIAL PRIMARY KEY,
    spool_id VARCHAR(20) NOT NULL,
    reason TEXT,
    pos1 DECIMAL(10,3),
    pos2 DECIMAL(10,3),
    defect_length DECIMAL(10,2),
    actual_cutting DECIMAL(10,2),

    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)