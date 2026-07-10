CREATE TABLE fg_color(
    fg_color_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(50) NOT NULL,
    bobbin_fid VARCHAR(50) NOT NULL,
    current_color VARCHAR(20),
    Require_color VARCHAR(20),
    total_length DECIMAL(10,3),
    balance_length DECIMAL(10,3),
    request_by VARCHAR(50),
    "date" DATE,
    "time" TIME,

    last_child_fid VARCHAR(50),
    count INT NOT NULL,

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)