CREATE TABLE fg_rewind (
    fg_rewind_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50),
    bobbin_fid VARCHAR(50),
    total_length DECIMAL(10,3),
    balance_length DECIMAL(10,3),   
    rewinding_type VARCHAR(50) CHECK ('CUT', 'REWINDING'),
    last_child_fid VARCHAR(50),
    count INT NOT NULL,

    request_by VARCHAR(50),
    "date" DATE,
    "time" TIME,

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP CURRENT_TIMESTAMP
)