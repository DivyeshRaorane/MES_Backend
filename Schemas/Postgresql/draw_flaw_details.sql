CREATE TABLE draw_flaw_details(
    draw_flaw_id SERIAL PRIMARY KEY,
    spool_id VARCHAR(20) NOT NULL,
    flaw_desc TEXT NOT NULL,
    start_length DECIMAL(10,2),
    end_length DECIMAL(10,2),
    diff_length DECIMAL(10,2),
    actual_cutting DECIMAL(10,2),

    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (spool_id) REFERENCES draw_entry(spool_id)
);