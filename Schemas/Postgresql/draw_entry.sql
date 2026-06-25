
CREATE TABLE draw_entry(
    spool_id VARCHAR(20) PRIMARY KEY,
    preform_id VARCHAR(20),
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    drawn_weight DECIMAL(10,2),
    drawn_length DECIMAL(10,2),
    balance_weight DECIMAL(10,2),
    shift_id INT,
    
    

    drawn_line_speed int,
    draw_tension DECIMAL(10,2),
    furnace_power DECIMAL(10,2),
    furnace_argon DECIMAL(10,2),
    furnace_he DECIMAL(10,2),
    tube_he DECIMAL(10,2),
    co2_flow DECIMAL(10,2),
    n2_flow DECIMAL(10,2),
    uv_air DECIMAL(10,2),
    winding_observation VARCHAR(100),
    scr_observation VARCHAR(100),
    top_end_scrap DECIMAL(10,2),
    bottom_end_scrap DECIMAL(10,2),
    die_clean BOOLEAN,
    spool_status VARCHAR(20) CHECK (
    spool_status IN ('Ok','Not Ok')),
    indication_fiber_cut VARCHAR(20),
    remark TEXT,

    primary_coating VARCHAR(20),
    secondary_coating VARCHAR(20),
    coating_type VARCHAR(20),
    primary_pressure DECIMAL(10,2),
    secondary_pressure DECIMAL(10,2),
    primary_batch VARCHAR(20),
    secondary_batch VARCHAR(20),
    process_note TEXT,

    logged_in_user INT NOT NULL,
    entry_date DATE DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (preform_id) REFERENCES preform_accept(preform_id)


)