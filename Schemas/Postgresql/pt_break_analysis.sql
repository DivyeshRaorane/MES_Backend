CREATE TABLE pt_break_analysis(
    break_analysis_id SERIAL PRIMARY KEY,
    fiber_id VARCHAR(50) UNIQUE NOT NULL,
    machine_no INT,
    break_length DECIMAL(10,3),
    break_type VARCHAR(50),
    break_category VARCHAR(50),
    break_remark TEXT,
    break_c_by VARCHAR(50),
    entry_done_by VARCHAR(50),
    main_break_type VARCHAR(50),
    sub_reason VARCHAR(50),
    next_sub_reason VARCHAR(50),
    dist_from_pheriphery DECIMAL(10,3),
    particle_size DECIMAL(10,3),
    flaw_size DECIMAL(10,3),
    bsa_remark VARCHAR(100),
    bsa_done_by VARCHAR(50),

    logged_in_user VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)