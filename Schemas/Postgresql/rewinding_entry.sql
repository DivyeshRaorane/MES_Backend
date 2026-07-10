
CREATE TABLE rewinding_entry (
    rewinding_id SERIAL PRIMARY KEY,
    bobbin_no VARCHAR(20) NOT NULL,
    fiber_length DECIMAL(10,3),
    fid VARCHAR(50),
    machine_no INT,
    rew_reason VARCHAR(50),
    rew_type VARCHAR(50),
    is_scrap BOOLEAN DEFAULT FALSE,
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
