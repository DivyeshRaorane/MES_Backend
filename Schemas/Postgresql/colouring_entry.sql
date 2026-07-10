
CREATE TABLE coloring_entry (
    colouring_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(20) NOT NULL,
    original_color VARCHAR(30),
    current_color VARCHAR(30),
    color_batch_code VARCHAR(50),
    length DECIMAL(10,3),
    fid VARCHAR(50),
    machine_no INT,

    -- FID & Scrap
    fid VARCHAR(30),
    scrap_length DECIMAL(10,3) DEFAULT 0,
    bobbin_type VARCHAR(50),
    operator VARCHAR(50),
    bobbin_colour VARCHAR(50),

    -- Remarks
    remark TEXT,

    -- Logged in user and entry time
    logged_in_user VARCHAR(50) NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

);
